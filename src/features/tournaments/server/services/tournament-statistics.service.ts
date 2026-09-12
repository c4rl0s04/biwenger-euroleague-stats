import 'server-only';

import {
  getAllTournaments,
  getTournamentFixtures,
  getTournamentStandings,
} from './tournament-read.service';
import { mapGlobalTournamentStatistics } from '../mappers/tournament-statistics.mapper';
import type { Tournament, TournamentFixture, TournamentStanding } from '../../models/tournaments';

export const TOURNAMENT_STATISTICS_POLICY = Object.freeze({
  access: 'public fantasy competition statistics; no session identity',
  serverCache: 'none; preserve independent season resolution in each read',
  httpCache: 'no owned HTTP endpoint; caller page policy unchanged',
  mutations: 'none',
} as const);

export interface TournamentStatisticsDependencies {
  all(): Promise<{ all: Tournament[] }>;
  fixtures(id: null): Promise<TournamentFixture[]>;
  standings(id: null): Promise<TournamentStanding[]>;
}
export function createTournamentStatisticsService(deps: TournamentStatisticsDependencies) {
  return async function getGlobalTournamentStats() {
    const [tournaments, fixtures, standings] = await Promise.all([
      deps.all(),
      deps.fixtures(null),
      deps.standings(null),
    ]);
    return mapGlobalTournamentStatistics(tournaments.all, fixtures, standings);
  };
}
export const getGlobalTournamentStats = createTournamentStatisticsService({
  all: getAllTournaments,
  fixtures: getTournamentFixtures,
  standings: getTournamentStandings,
});
