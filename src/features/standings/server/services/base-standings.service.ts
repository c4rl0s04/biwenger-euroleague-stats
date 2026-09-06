import 'server-only';

import type { StandingsOptions } from '../../models/base-standings';
import {
  mapFullStandings,
  mapSimpleStandings,
  mapValueRanking,
  mapLeagueOverview,
} from '../mappers/base-standings.mapper';
import {
  queryFullStandings,
  querySimpleStandings,
  queryValueRanking,
  queryLeagueOverview,
} from '../queries/base-standings.query';
import type {
  FullStandingsRecord,
  SimpleStandingsRecord,
  ValueRankingRecord,
  LeagueOverviewRecords,
} from '../queries/base-standings.records';

export const STANDINGS_ACCESS_POLICY = Object.freeze({
  read: 'public-league-statistics',
  identity: 'none',
  mutations: 'none',
} as const);
export const STANDINGS_CACHE_POLICY = Object.freeze({
  server: 'uncached',
  fullHttpSeconds: 60,
  overviewHttpSeconds: 900,
  valueHttpSeconds: 900,
  staleSeconds: 60,
} as const);

export interface BaseStandingsDependencies {
  full(options: StandingsOptions): Promise<FullStandingsRecord[]>;
  simple(): Promise<SimpleStandingsRecord[]>;
  values(): Promise<ValueRankingRecord[]>;
  overview(): Promise<LeagueOverviewRecords>;
}

export function createBaseStandingsService(dependencies: BaseStandingsDependencies) {
  return {
    async getFullStandings(options: StandingsOptions = {}) {
      return (await dependencies.full(options)).map(mapFullStandings);
    },
    async getSimpleStandings() {
      return (await dependencies.simple()).map(mapSimpleStandings);
    },
    async fetchValueRanking() {
      return (await dependencies.values()).map(mapValueRanking);
    },
    async getLeagueOverview() {
      return mapLeagueOverview(await dependencies.overview());
    },
  };
}

// Each invocation resolves the season and reads again; no persistent/request cache is added.
export const { getFullStandings, getSimpleStandings, fetchValueRanking, getLeagueOverview } =
  createBaseStandingsService({
    full: queryFullStandings,
    simple: querySimpleStandings,
    values: queryValueRanking,
    overview: queryLeagueOverview,
  });
