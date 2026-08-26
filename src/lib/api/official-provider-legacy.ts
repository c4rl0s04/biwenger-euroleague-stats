import { fetchBoxScore, fetchGameHeader, fetchSchedule, fetchTeams } from './euroleague-client';
import type {
  OfficialBasketballProvider,
  OfficialGameMetadata,
  OfficialGameReport,
  OfficialPlayerBoxScore,
  OfficialPlayerProfile,
  OfficialPlayByPlayEvent,
  OfficialScheduleGame,
  OfficialShot,
  OfficialStanding,
} from './official-provider';
import { normalizeOfficialPlayerCode } from './official-provider';

const number = (value: unknown): number => Number(value) || 0;
const text = (value: unknown): string => String(value ?? '').trim();
const bool = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

export class LegacyEuroleagueProvider implements OfficialBasketballProvider {
  readonly name = 'legacy' as const;

  constructor(private readonly seasonCode: string) {}

  getMetrics() {
    return {
      requests: 0,
      retries: 0,
      notFound: 0,
      emptyResponses: 0,
      status401: 0,
      status429: 0,
      status5xx: 0,
      lastSuccessfulAt: null,
    };
  }

  private codeForYear(seasonYear: number): string {
    const expected = `E${seasonYear}`;
    if (this.seasonCode !== expected) {
      throw new Error(`Legacy provider configured for ${this.seasonCode}, received ${seasonYear}.`);
    }
    return expected;
  }

  async getSchedule(seasonYear: number): Promise<OfficialScheduleGame[]> {
    const response = await fetchSchedule(this.codeForYear(seasonYear));
    const items = response?.schedule?.item || [];
    return items.map((item: any) => ({
      seasonYear,
      gameCode: number(item.game),
      gameId: `${this.seasonCode}_${item.game}`,
      roundNumber: number(item.gameday) || null,
      roundCode: text(item.round) || null,
      phase: text(item.group) || null,
      homeTeamCode: text(item.homecode),
      homeTeamName: text(item.hometeam),
      awayTeamCode: text(item.awaycode),
      awayTeamName: text(item.awayteam),
      scheduledAt: item.date
        ? new Date(`${item.date} ${text(item.startime) || '00:00'} UTC`)
        : null,
      arenaCode: text(item.arenacode) || null,
      arenaName: text(item.arenaname) || null,
      arenaCapacity: number(item.arenacapacity) || null,
      isDateConfirmed: bool(item.confirmeddate),
      isTimeConfirmed: bool(item.confirmedtime),
      isPlayed: bool(item.played),
      raw: item,
    }));
  }

  async getStandings(seasonYear: number, roundNumber: number): Promise<OfficialStanding[]> {
    const data = await fetchTeams(this.codeForYear(seasonYear));
    const clubs = data?.clubs?.club
      ? Array.isArray(data.clubs.club)
        ? data.clubs.club
        : [data.clubs.club]
      : [];
    return clubs.map((club: any) => ({
      roundNumber,
      teamCode: text(club.code),
      teamName: text(club.name),
      crestUrl: club.crest || null,
      position: null,
      gamesPlayed: null,
      gamesWon: null,
      gamesLost: null,
      pointsFor: null,
      pointsAgainst: null,
      raw: club,
    }));
  }

  async getPlayerProfiles(seasonYear: number): Promise<OfficialPlayerProfile[]> {
    const data = await fetchTeams(this.codeForYear(seasonYear));
    const clubs = data?.clubs?.club
      ? Array.isArray(data.clubs.club)
        ? data.clubs.club
        : [data.clubs.club]
      : [];
    return clubs.flatMap((club: any) => {
      const roster = club.roster?.player
        ? Array.isArray(club.roster.player)
          ? club.roster.player
          : [club.roster.player]
        : [];
      return roster.map((player: any) => ({
        playerCode: normalizeOfficialPlayerCode(player.code),
        playerName: text(player.name),
        teamCode: text(club.code) || null,
        teamName: text(club.name) || null,
        imageUrl: player.imageurl || null,
        teamImageUrl: club.crest || null,
        age: null,
        raw: player,
      }));
    });
  }

  async getGameReport(seasonYear: number, gameCode: number): Promise<OfficialGameReport | null> {
    const schedule = await this.getSchedule(seasonYear);
    const game = schedule.find((item) => item.gameCode === gameCode);
    if (!game) return null;
    return {
      gameCode,
      roundNumber: game.roundNumber,
      phase: game.phase,
      homeTeamCode: game.homeTeamCode,
      awayTeamCode: game.awayTeamCode,
      homeScore: null,
      awayScore: null,
      scheduledAt: game.scheduledAt,
      isPlayed: game.isPlayed,
      homeCrestUrl: null,
      awayCrestUrl: null,
      raw: game.raw,
    };
  }

  async getGameMetadata(
    seasonYear: number,
    gameCode: number
  ): Promise<OfficialGameMetadata | null> {
    const header = await fetchGameHeader(gameCode, this.codeForYear(seasonYear));
    if (!header) return null;
    const cumulative = (team: 'A' | 'B') =>
      [1, 2, 3, 4].map((q) => number(header[`ScoreQuarter${q}${team}`]));
    const delta = (values: number[]) =>
      values.map((value, index) => value - (index ? values[index - 1] : 0));
    return {
      gameCode,
      isLive: bool(header.Live),
      homeScore: number(header.ScoreA),
      awayScore: number(header.ScoreB),
      homeQuarterScores: delta(cumulative('A')),
      awayQuarterScores: delta(cumulative('B')),
      homeOvertime: number(header.ScoreExtraTimeA),
      awayOvertime: number(header.ScoreExtraTimeB),
      arenaName: text(header.Stadium) || null,
      arenaCapacity: number(header.Capacity) || null,
      homeCoach: text(header.CoachA) || null,
      awayCoach: text(header.CoachB) || null,
      referees: [header.Referee1, header.Referee2, header.Referee3].map(text).filter(Boolean),
      raw: header,
    };
  }

  async getPlayerBoxScore(seasonYear: number, gameCode: number): Promise<OfficialPlayerBoxScore[]> {
    const boxscore = await fetchBoxScore(gameCode, this.codeForYear(seasonYear));
    if (!boxscore?.Stats) return [];
    return boxscore.Stats.flatMap((teamStats: any) =>
      (teamStats.PlayersStats || [])
        .filter((player: any) => player.Minutes !== 'DNP')
        .map((player: any) => {
          const minutes = text(player.Minutes) || null;
          const [mins, secs] = (minutes || '').split(':').map(Number);
          return {
            gameCode,
            playerCode: normalizeOfficialPlayerCode(player.Player_ID),
            playerName: text(player.Player),
            teamCode: text(player.Team || teamStats.Team),
            isHome: null,
            isStarter: null,
            isPlaying: true,
            dorsal: text(player.Dorsal) || null,
            minutes,
            minutesSeconds: (mins || 0) * 60 + (secs || 0),
            points: number(player.Points),
            twoPointsMade: number(player.FieldGoalsMade2),
            twoPointsAttempted: number(player.FieldGoalsAttempted2),
            threePointsMade: number(player.FieldGoalsMade3),
            threePointsAttempted: number(player.FieldGoalsAttempted3),
            freeThrowsMade: number(player.FreeThrowsMade),
            freeThrowsAttempted: number(player.FreeThrowsAttempted),
            offensiveRebounds: number(player.OffensiveRebounds),
            defensiveRebounds: number(player.DefensiveRebounds),
            totalRebounds: number(player.TotalRebounds),
            assists: number(player.Assistances),
            steals: number(player.Steals),
            turnovers: number(player.Turnovers),
            blocks: number(player.BlocksFavour),
            blocksAgainst: number(player.BlocksAgainst),
            foulsCommitted: number(player.FoulsCommited),
            foulsReceived: number(player.FoulsReceived),
            valuation: number(player.Valuation),
            plusMinus: number(player.Plusminus),
            raw: player,
          };
        })
    );
  }

  async getPlayByPlay(): Promise<OfficialPlayByPlayEvent[]> {
    return [];
  }

  async getShots(): Promise<OfficialShot[]> {
    return [];
  }
}
