import 'server-only';
import {
  getComparisonManagers,
  getComparisonSquad,
  getManagerCaptainStats,
  getManagerHomeAwayStats,
} from '@/features/managers/server';
import { getFullStandings } from '@/features/standings/server';
import { getPorrasStats } from '@/features/predictions/server';
import { getUserPerformanceHistoryService } from '@/features/rounds/server';
import { getCompareAdvancedData } from './advanced.service';
import { mapSquadSummary, mapComparePredictions } from '../mappers/compare.mapper';
import type {
  CompareDataResponse,
  CompareDataLiteResponse,
  CompareHistory,
} from '../../models/compare';

export const COMPARE_READ_POLICY = Object.freeze({
  access: 'public league-wide fantasy statistics; no session/cookie or request-ID dependency',
  httpCache: 'public, max-age=300, stale-while-revalidate=60',
  errorCache: 'private, no-store, max-age=0, must-revalidate',
  serverCache: 'none added; upstream season-keyed rivalry cache remains 900 seconds',
  pageAccess: 'existing parent authentication and mobile route guards',
  mutations: 'none',
});
const defaultDependencies = {
  users: getComparisonManagers,
  squad: getComparisonSquad,
  standings: getFullStandings,
  predictions: getPorrasStats,
  history: getUserPerformanceHistoryService,
  captain: getManagerCaptainStats,
  homeAway: getManagerHomeAwayStats,
  advanced: getCompareAdvancedData,
};
export function createCompareService(deps = defaultDependencies) {
  async function load(full: boolean) {
    // Full waits for the same complete initial dependency group before starting histories.
    // Lite deliberately never invokes advanced reads. No memoization is introduced.
    const [users, standings, predictions, advancedStats] = await Promise.all([
      deps.users(),
      deps.standings(),
      deps.predictions(),
      full ? deps.advanced() : undefined,
    ]);
    const history = await Promise.all(
      users.map(async (user): Promise<CompareHistory> => {
        const [history, captain, homeAway, squad] = await Promise.all([
          deps.history(user.id),
          deps.captain(user.id),
          deps.homeAway(user.id),
          deps.squad(user.id),
        ]);
        return { userId: user.id, history, captain, homeAway, squadStats: mapSquadSummary(squad) };
      })
    );
    const data: CompareDataLiteResponse = {
      users,
      history,
      standings: standings || [],
      porras: predictions?.porra_stats?.promedios || [],
      predictions: mapComparePredictions(predictions),
    };
    return { data, advancedStats };
  }
  return {
    async getCompareDataLite(): Promise<CompareDataLiteResponse> {
      return (await load(false)).data;
    },
    async getCompareData(): Promise<CompareDataResponse> {
      const { data, advancedStats } = await load(true);
      return { ...data, advancedStats: advancedStats! };
    },
  };
}
export const { getCompareData, getCompareDataLite } = createCompareService();
