import 'server-only';
import { queryLastRoundMVPs, queryLastRoundStats } from '../queries/last-round.query';
import { queryHighestRoundSnapshot } from '../queries/highest-round.query';
import { mapLastRoundMVP, mapLastRoundStats, mapHighestRound } from '../mappers/last-round.mapper';

export const LAST_ROUND_POLICY = {
  access: 'public-fantasy-statistics',
  serverCache: 'none',
  httpSeconds: 300,
} as const;
export function createLastRoundService(deps: {
  mvps: typeof queryLastRoundMVPs;
  stats: typeof queryLastRoundStats;
  highest: typeof queryHighestRoundSnapshot;
}) {
  return {
    async getLastRoundMVPs(limit = 5) {
      return (await deps.mvps(limit)).map(mapLastRoundMVP);
    },
    async getLastRoundStats() {
      return (await deps.stats()).map(mapLastRoundStats);
    },
    async getHighestRoundSnapshot() {
      const snapshot = await deps.highest();
      return {
        seasonId: snapshot.seasonId,
        record: snapshot.record ? mapHighestRound(snapshot.record) : null,
      };
    },
  };
}
export const { getLastRoundMVPs, getLastRoundStats, getHighestRoundSnapshot } =
  createLastRoundService({
    mvps: queryLastRoundMVPs,
    stats: queryLastRoundStats,
    highest: queryHighestRoundSnapshot,
  });
