import { mapEuroleagueBoxScoreRow } from './box-score.mapper';
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
import { asBoolean, asString, normalizeEuroleaguePlayerCode, requiredString } from './normalization';
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

export {
  minutesToSeconds,
  parseMinutes,
  parseProviderNumber,
  type ParsedMinutes,
} from './box-score.mapper';

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

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  if (Number.isNaN(parsed.getTime())) return null;
  // The schedule feed gives Madrid wall time without a timezone; resolve its DST offset.
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(parsed)
    .find((part) => part.type === 'timeZoneName')
    ?.value.match(/GMT([+-]\d+)/)?.[1];
  return offset ? new Date(parsed.getTime() - Number(offset) * 60 * 60 * 1000) : null;
}

function parseIsoDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) return null;
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

function quarters(row: EuroleagueRow, team: 'A' | 'B'): (number | null)[] {
  const cumulative = [1, 2, 3, 4].map((quarter) => asNumber(row[`ScoreQuarter${quarter}${team}`]));
  return cumulative.map((score, index) => {
    if (score == null) return null;
    const prev = index === 0 ? 0 : cumulative[index - 1];
    if (prev == null) return null;
    return score - prev;
  });
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

        const payload: unknown = JSON.parse(await response.text(), (key, value: unknown) => {
          // PostgreSQL rejects NUL in JSONB keys as well as values.
          if (key.includes('\0')) return undefined;
          return typeof value === 'string' ? value.replaceAll('\0', '') : value;
        });
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
      homeOvertime: asNumber(row.ScoreExtraTimeA),
      awayOvertime: asNumber(row.ScoreExtraTimeB),
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
    return (rows || []).map((row) => mapEuroleagueBoxScoreRow(row, gameCode));
  }

  async getPlayByPlay(
    seasonYear: number,
    gameCode: number
  ): Promise<EuroleaguePlayByPlayEvent[] | null> {
    const rows = await this.getRows(
      'play-by-play/game',
      { season: seasonYear, gamecode: gameCode },
      playByPlayRowSchema,
      true
    );
    if (rows === null) return null;
    return rows.map((row) => ({
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

  async getShots(seasonYear: number, gameCode: number): Promise<EuroleagueShot[] | null> {
    const rows = await this.getRows(
      'shot-data/game',
      { season: seasonYear, gamecode: gameCode },
      shotRowSchema,
      true
    );
    if (rows === null) return null;
    return rows.map((row) => ({
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
