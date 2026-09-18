import 'server-only';
import { readManagerCaptainStats, readManagerHomeAway } from '../queries/manager-performance.query';
import { mapManagerCaptainStats, mapManagerHomeAway } from '../mappers/manager-performance.mapper';

export const MANAGER_PERFORMANCE_POLICY = Object.freeze({
  identity: 'caller-resolved; HTTP query then session validation remains at the edge',
  httpCache: 'private, no-store, max-age=0, must-revalidate',
  serverCache: 'none',
  mutations: 'none',
} as const);

export function createManagerPerformanceService(
  deps = {
    captain: readManagerCaptainStats,
    homeAway: readManagerHomeAway,
  }
) {
  return {
    async getManagerCaptainStats(userId: string | number) {
      return mapManagerCaptainStats(await deps.captain(userId));
    },
    async getManagerHomeAwayStats(userId: string | number) {
      return mapManagerHomeAway(await deps.homeAway(userId));
    },
  };
}

export const { getManagerCaptainStats, getManagerHomeAwayStats } =
  createManagerPerformanceService();
