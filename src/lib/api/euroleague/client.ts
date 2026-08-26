import { createHash } from 'node:crypto';
import type { z } from 'zod';
import {
  boxScoreRowSchema,
  gameMetadataRowSchema,
  gameReportRowSchema,
  playerProfileRowSchema,
  playByPlayRowSchema,
  scheduleRowSchema,
  shotRowSchema,
  standingRowSchema,
  type EuroleagueRow,
} from './schemas';
import { normalizeEuroleaguePlayerCode } from './normalization';
import type {
  EuroleagueClientMetrics,
  EuroleagueGameMetadata,
  EuroleagueGameReport,
  EuroleaguePlayerBoxScore,
  EuroleaguePlayerProfile,
  EuroleaguePlayByPlayEvent,
  EuroleagueScheduleGame,
  EuroleagueShot,
  EuroleagueStanding,
} from './types';

export class EuroleagueApiError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
    message: string
  ) {
    super(message);
    this.name = 'EuroleagueApiError';
  }
}

export interface EuroleagueClientOptions {
  baseUrl?: string;
  token?: string | null;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

type RowSchema = z.ZodType<EuroleagueRow>;

const asString = (value: unknown): string | null =>
  value === null || value === undefined || value === '' ? null : String(value).trim();

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const requiredString = (row: EuroleagueRow, key: string): string => {
  const value = asString(row[key]);
  if (!value) throw new Error(`EuroLeague API row is missing ${key}.`);
  return value;
};

const requiredNumber = (row: EuroleagueRow, key: string): number => {
  const value = asNumber(row[key]);
  if (value === null) throw new Error(`EuroLeague API row is missing ${key}.`);
  return value;
};

function parseScheduleDate(dateValue: unknown, timeValue: unknown): Date | null {
  const date = asString(dateValue);
  if (!date) return null;
  const parsed = new Date(`${date} ${asString(timeValue) || '00:00'} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseProviderUtc(value: unknown): Date | null {
  const raw = asString(value);
  if (!raw || !/^\d{14}$/.test(raw)) return null;
  return new Date(
    `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}Z`
  );
}

function minutesToSeconds(value: string | null): number {
  if (!value || value === 'DNP') return 0;
  const [minutes, seconds] = value.split(':').map(Number);
  return (Number.isFinite(minutes) ? minutes : 0) * 60 + (Number.isFinite(seconds) ? seconds : 0);
}

function quarters(row: EuroleagueRow, team: 'A' | 'B'): number[] {
  const cumulative = [1, 2, 3, 4].map(
    (quarter) => asNumber(row[`ScoreQuarter${quarter}${team}`]) ?? 0
  );
  return cumulative.map((score, index) => score - (index === 0 ? 0 : cumulative[index - 1]));
}

export function checksumPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export class EuroleagueClient {
  private readonly baseUrl: string;
  private readonly token: string | null;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly metrics: EuroleagueClientMetrics = {
    requests: 0,
    retries: 0,
    notFound: 0,
    emptyResponses: 0,
    status401: 0,
    status429: 0,
    status5xx: 0,
    lastSuccessfulAt: null,
  };

  constructor(options: EuroleagueClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://euroleague-advanced-api.eu').replace(/\/$/, '');
    this.token = options.token?.trim() || null;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.retries = options.retries ?? 3;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getMetrics(): Readonly<EuroleagueClientMetrics> {
    return { ...this.metrics };
  }

  private async getRows(
    path: string,
    query: Record<string, string | number>,
    schema: RowSchema,
    allowNotFound: boolean
  ): Promise<EuroleagueRow[] | null> {
    const url = new URL(`${this.baseUrl}/Euroleague/${path}`);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        this.metrics.requests++;
        const response = await this.fetchImpl(url, {
          headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
          signal: controller.signal,
        });

        if (response.status === 401) this.metrics.status401++;
        if (response.status === 429) this.metrics.status429++;
        if (response.status >= 500) this.metrics.status5xx++;
        if (response.status === 404) {
          this.metrics.notFound++;
          if (allowNotFound) return null;
          throw new EuroleagueApiError(404, path, `EuroLeague API returned 404 for ${path}.`);
        }
        if ((response.status === 429 || response.status >= 500) && attempt < this.retries) {
          this.metrics.retries++;
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          continue;
        }
        if (!response.ok) {
          throw new EuroleagueApiError(
            response.status,
            path,
            `EuroLeague API returned ${response.status} for ${path}.`
          );
        }

        const payload = await response.json();
        const rows = schema.array().parse(payload) as EuroleagueRow[];
        if (rows.length === 0) this.metrics.emptyResponses++;
        this.metrics.lastSuccessfulAt = new Date().toISOString();
        return rows;
      } catch (error) {
        const retryable =
          error instanceof EuroleagueApiError
            ? error.status === 429 || error.status >= 500
            : error instanceof TypeError || (error instanceof Error && error.name === 'AbortError');
        if (retryable && attempt < this.retries) {
          this.metrics.retries++;
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error(`EuroLeague API retries exhausted for ${path}.`);
  }

  async getSchedule(seasonYear: number): Promise<EuroleagueScheduleGame[]> {
    const rows = await this.getRows('schedule', { season: seasonYear }, scheduleRowSchema, false);
    return (rows || []).map((row) => ({
      seasonYear,
      gameCode: requiredNumber(row, 'game'),
      gameId: requiredString(row, 'gamecode'),
      roundNumber: asNumber(row.gameday),
      roundCode: asString(row.round),
      phase: asString(row.group),
      homeTeamCode: requiredString(row, 'homecode'),
      homeTeamName: requiredString(row, 'hometeam'),
      awayTeamCode: requiredString(row, 'awaycode'),
      awayTeamName: requiredString(row, 'awayteam'),
      scheduledAt: parseScheduleDate(row.date, row.startime),
      arenaCode: asString(row.arenacode),
      arenaName: asString(row.arenaname),
      arenaCapacity: asNumber(row.arenacapacity),
      isDateConfirmed: asBoolean(row.confirmeddate),
      isTimeConfirmed: asBoolean(row.confirmedtime),
      isPlayed: asBoolean(row.played),
      raw: row,
    }));
  }

  async getStandings(seasonYear: number, roundNumber: number): Promise<EuroleagueStanding[]> {
    const rows = await this.getRows(
      'standings',
      { season: seasonYear, round_number: roundNumber, standings_type: 'basicstandings' },
      standingRowSchema,
      false
    );
    return (rows || []).map((row) => ({
      roundNumber,
      teamCode: requiredString(row, 'club.code'),
      teamName: requiredString(row, 'club.name'),
      crestUrl: asString(row['club.images.crest']),
      position: asNumber(row.position),
      gamesPlayed: asNumber(row.gamesPlayed),
      gamesWon: asNumber(row.gamesWon),
      gamesLost: asNumber(row.gamesLost),
      pointsFor: asNumber(row.pointsFor),
      pointsAgainst: asNumber(row.pointsAgainst),
      raw: row,
    }));
  }

  async getPlayerProfiles(seasonYear: number): Promise<EuroleaguePlayerProfile[]> {
    const rows = await this.getRows(
      'players/season',
      {
        stats_type: 'traditional',
        phase: 'all',
        season: seasonYear,
        statistic_mode: 'accumulated',
      },
      playerProfileRowSchema,
      false
    );
    return (rows || []).map((row) => ({
      playerCode: normalizeEuroleaguePlayerCode(row['player.code']),
      playerName: requiredString(row, 'player.name'),
      teamCode: asString(row['player.team.code']),
      teamName: asString(row['player.team.name']),
      imageUrl: asString(row['player.imageUrl']),
      teamImageUrl: asString(row['player.team.imageUrl']),
      age: asNumber(row['player.age']),
      raw: row,
    }));
  }

  async getGameReport(seasonYear: number, gameCode: number): Promise<EuroleagueGameReport | null> {
    const row = (
      await this.getRows(
        'games/report/game',
        { season: seasonYear, gamecode: gameCode },
        gameReportRowSchema,
        true
      )
    )?.[0];
    if (!row) return null;
    return {
      gameCode,
      roundNumber: asNumber(row.Round),
      phase: asString(row['phaseType.code']) || asString(row['phaseType.name']),
      homeTeamCode: requiredString(row, 'local.club.code'),
      awayTeamCode: requiredString(row, 'road.club.code'),
      homeScore: asNumber(row['local.score']),
      awayScore: asNumber(row['road.score']),
      scheduledAt: parseIsoDate(row.utcDate) || parseIsoDate(row.date),
      isPlayed: asBoolean(row.played),
      homeCrestUrl: asString(row['local.club.images.crest']),
      awayCrestUrl: asString(row['road.club.images.crest']),
      raw: row,
    };
  }

  async getGameMetadata(
    seasonYear: number,
    gameCode: number
  ): Promise<EuroleagueGameMetadata | null> {
    const row = (
      await this.getRows(
        'games/metadata/game',
        { season: seasonYear, gamecode: gameCode },
        gameMetadataRowSchema,
        true
      )
    )?.[0];
    if (!row) return null;
    return {
      gameCode,
      isLive: asBoolean(row.Live),
      homeScore: asNumber(row.ScoreA),
      awayScore: asNumber(row.ScoreB),
      homeQuarterScores: quarters(row, 'A'),
      awayQuarterScores: quarters(row, 'B'),
      homeOvertime: asNumber(row.ScoreExtraTimeA) ?? 0,
      awayOvertime: asNumber(row.ScoreExtraTimeB) ?? 0,
      arenaName: asString(row.Stadium),
      arenaCapacity: asNumber(row.Capacity),
      homeCoach: asString(row.CoachA),
      awayCoach: asString(row.CoachB),
      referees: [row.Referee1, row.Referee2, row.Referee3]
        .map(asString)
        .filter((value): value is string => Boolean(value)),
      raw: row,
    };
  }

  async getPlayerBoxScore(
    seasonYear: number,
    gameCode: number
  ): Promise<EuroleaguePlayerBoxScore[]> {
    const rows = await this.getRows(
      'boxscore/players/game',
      { season: seasonYear, gamecode: gameCode },
      boxScoreRowSchema,
      true
    );
    return (rows || []).map((row) => {
      const minutes = asString(row.Minutes);
      return {
        gameCode,
        playerCode: normalizeEuroleaguePlayerCode(row.Player_ID),
        playerName: requiredString(row, 'Player'),
        teamCode: requiredString(row, 'Team'),
        isHome: row.Home == null ? null : asBoolean(row.Home),
        isStarter: row.IsStarter == null ? null : asBoolean(row.IsStarter),
        isPlaying: row.IsPlaying == null ? null : asBoolean(row.IsPlaying),
        dorsal: asString(row.Dorsal),
        minutes,
        minutesSeconds: minutesToSeconds(minutes),
        points: asNumber(row.Points) ?? 0,
        twoPointsMade: asNumber(row.FieldGoalsMade2) ?? 0,
        twoPointsAttempted: asNumber(row.FieldGoalsAttempted2) ?? 0,
        threePointsMade: asNumber(row.FieldGoalsMade3) ?? 0,
        threePointsAttempted: asNumber(row.FieldGoalsAttempted3) ?? 0,
        freeThrowsMade: asNumber(row.FreeThrowsMade) ?? 0,
        freeThrowsAttempted: asNumber(row.FreeThrowsAttempted) ?? 0,
        offensiveRebounds: asNumber(row.OffensiveRebounds) ?? 0,
        defensiveRebounds: asNumber(row.DefensiveRebounds) ?? 0,
        totalRebounds: asNumber(row.TotalRebounds) ?? 0,
        assists: asNumber(row.Assistances) ?? 0,
        steals: asNumber(row.Steals) ?? 0,
        turnovers: asNumber(row.Turnovers) ?? 0,
        blocks: asNumber(row.BlocksFavour) ?? 0,
        blocksAgainst: asNumber(row.BlocksAgainst) ?? 0,
        foulsCommitted: asNumber(row.FoulsCommited) ?? 0,
        foulsReceived: asNumber(row.FoulsReceived) ?? 0,
        valuation: asNumber(row.Valuation) ?? 0,
        plusMinus: asNumber(row.Plusminus) ?? 0,
        raw: row,
      };
    });
  }

  async getPlayByPlay(seasonYear: number, gameCode: number): Promise<EuroleaguePlayByPlayEvent[]> {
    const rows = await this.getRows(
      'play-by-play/game',
      { season: seasonYear, gamecode: gameCode },
      playByPlayRowSchema,
      true
    );
    return (rows || []).map((row) => ({
      gameCode,
      sequence: requiredNumber(row, 'TRUE_NUMBEROFPLAY'),
      providerPlayNumber: asNumber(row.NUMBEROFPLAY),
      period: asNumber(row.PERIOD),
      minute: asNumber(row.MINUTE),
      markerTime: asString(row.MARKERTIME),
      playType: asString(row.PLAYTYPE),
      teamCode: asString(row.CODETEAM),
      playerCode: asString(row.PLAYER_ID) ? normalizeEuroleaguePlayerCode(row.PLAYER_ID) : null,
      playerName: asString(row.PLAYER),
      teamName: asString(row.TEAM),
      dorsal: asString(row.DORSAL),
      homeScore: asNumber(row.POINTS_A),
      awayScore: asNumber(row.POINTS_B),
      comment: asString(row.COMMENT),
      playInfo: asString(row.PLAYINFO),
      raw: row,
    }));
  }

  async getShots(seasonYear: number, gameCode: number): Promise<EuroleagueShot[]> {
    const rows = await this.getRows(
      'shot-data/game',
      { season: seasonYear, gamecode: gameCode },
      shotRowSchema,
      true
    );
    return (rows || []).map((row) => ({
      gameCode,
      annotationNumber: requiredNumber(row, 'NUM_ANOT'),
      teamCode: asString(row.TEAM),
      playerCode: asString(row.ID_PLAYER) ? normalizeEuroleaguePlayerCode(row.ID_PLAYER) : null,
      playerName: asString(row.PLAYER),
      actionId: asString(row.ID_ACTION),
      action: asString(row.ACTION),
      points: asNumber(row.POINTS) ?? 0,
      coordinateX: asNumber(row.COORD_X),
      coordinateY: asNumber(row.COORD_Y),
      zone: asString(row.ZONE),
      isFastbreak: asBoolean(row.FASTBREAK),
      isSecondChance: asBoolean(row.SECOND_CHANCE),
      isPointsOffTurnover: asBoolean(row.POINTS_OFF_TURNOVER),
      minute: asNumber(row.MINUTE),
      markerTime: asString(row.CONSOLE),
      homeScore: asNumber(row.POINTS_A),
      awayScore: asNumber(row.POINTS_B),
      occurredAt: parseProviderUtc(row.UTC),
      raw: row,
    }));
  }
}
