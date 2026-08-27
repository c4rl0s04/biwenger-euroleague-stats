export interface ProviderSnapshotInput {
  seasonId: string;
  biwengerLeagueId: string;
  biwengerUserId: string;
  euroleagueCode: string;
  league: any;
  competition: any;
  schedule: any;
}

export interface AdvancedProviderSnapshotInput {
  seasonYear: number;
  expectedSeasonId: string;
  schedule: { seasonYear: number; gameCode: number; homeTeamCode: string; awayTeamCode: string }[];
  standings: { teamCode: string }[];
}

export interface ProviderSnapshotCounts {
  players: number;
  teams: number;
  standings: number;
  games: number;
}

export interface BiwengerRoundSeasonInput {
  seasonId: string;
  games: { id?: number; date?: number | string | null }[];
}

function biwengerGameDate(value: number | string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const milliseconds = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Biwenger keeps the previous season's rounds available until its fantasy game rolls over.
 * Refuse those payloads before catalogue identities are written into the active season.
 */
export function validateBiwengerRoundSeason(input: BiwengerRoundSeasonInput) {
  if (input.games.length === 0) {
    throw new Error(`Biwenger ${input.seasonId} readiness probe returned no first-round games.`);
  }

  const expectedYear = Number(input.seasonId.slice(0, 4));
  const dates = input.games
    .map((game) => biwengerGameDate(game.date))
    .filter((date): date is Date => date !== null);
  if (dates.length === 0) {
    throw new Error(`Biwenger ${input.seasonId} readiness probe returned no dated first-round games.`);
  }

  const years = Array.from(new Set(dates.map((date) => date.getUTCFullYear())));
  if (years.length !== 1 || years[0] !== expectedYear) {
    throw new Error(
      `Biwenger first round still belongs to ${years.join(', ') || 'an unknown year'}; expected ${expectedYear} for ${input.seasonId}. The provider has not rolled over to the configured season.`
    );
  }

  return {
    games: input.games.length,
    datedGames: dates.length,
    seasonYear: years[0],
    earliestGame: new Date(Math.min(...dates.map((date) => date.getTime()))).toISOString(),
    latestGame: new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString(),
  };
}

function countCollection(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

export function validateProviderSnapshot(input: ProviderSnapshotInput): ProviderSnapshotCounts {
  const returnedLeagueId = input.league?.data?.id ?? input.league?.id;
  if (returnedLeagueId != null && String(returnedLeagueId) !== input.biwengerLeagueId) {
    throw new Error(
      `Biwenger returned league ${returnedLeagueId}, expected ${input.biwengerLeagueId}.`
    );
  }

  const standings = input.league?.data?.standings || [];
  if (!standings.some((user: any) => String(user.id) === input.biwengerUserId)) {
    throw new Error(
      `Biwenger user ${input.biwengerUserId} is not present in league ${input.biwengerLeagueId}.`
    );
  }

  const competitionData = input.competition?.data?.data || input.competition?.data || {};
  const counts = {
    players: countCollection(competitionData.players),
    teams: countCollection(competitionData.teams),
    standings: countCollection(standings),
    games: Array.isArray(input.schedule)
      ? input.schedule.length
      : countCollection(input.schedule?.schedule?.item),
  };

  if (counts.players === 0) throw new Error('Biwenger competition probe returned no players.');
  if (counts.teams === 0) throw new Error('Biwenger competition probe returned no teams.');
  if (counts.standings === 0) throw new Error('Biwenger league probe returned no standings.');
  if (counts.games === 0) {
    throw new Error(`EuroLeague season ${input.euroleagueCode} returned no schedule.`);
  }

  return counts;
}

export function validateAdvancedProviderSnapshot(input: AdvancedProviderSnapshotInput) {
  if (!input.expectedSeasonId.startsWith(`${input.seasonYear}-`)) {
    throw new Error(
      `Official season ${input.seasonYear} does not match ${input.expectedSeasonId}.`
    );
  }
  if (input.schedule.length === 0) throw new Error('Official schedule is empty.');
  if (input.standings.length === 0) throw new Error('Official standings are empty.');
  const codes = new Set<number>();
  const teams = new Set<string>();
  for (const game of input.schedule) {
    if (game.seasonYear !== input.seasonYear) {
      throw new Error(`Game ${game.gameCode} belongs to season ${game.seasonYear}.`);
    }
    if (codes.has(game.gameCode)) throw new Error(`Duplicate official game code ${game.gameCode}.`);
    codes.add(game.gameCode);
    teams.add(game.homeTeamCode);
    teams.add(game.awayTeamCode);
  }
  if (teams.size === 0) throw new Error('Official schedule contains no teams.');
  return { games: input.schedule.length, teams: teams.size, standings: input.standings.length };
}
