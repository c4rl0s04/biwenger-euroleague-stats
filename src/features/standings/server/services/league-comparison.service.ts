import 'server-only';
import type { LeaderGap } from '../../models/league-comparison';
import { getSimpleStandings } from './base-standings.service';
import { queryLeagueAverage } from '../queries/league-average.query';

export const LEAGUE_COMPARISON_POLICY = {
  access: 'public-fantasy-statistics',
  serverCache: 'none',
  averageHttpSeconds: 300,
  leaderHttp: 'private-no-store-session-capable-route',
} as const;
export function createLeagueComparisonService(deps: {
  standings: typeof getSimpleStandings;
  average: typeof queryLeagueAverage;
}) {
  return {
    async getLeaderComparison(userId: string | number): Promise<LeaderGap | null> {
      const standings = await deps.standings();
      const leader = standings[0];
      const second = standings[1];
      const user = standings.find((entry) => String(entry.user_id) === String(userId));
      if (!user || !leader) return null;
      const gap = leader.total_points - user.total_points;
      return {
        leader_name: leader.name,
        leader_points: leader.total_points,
        user_points: user.total_points,
        gap,
        gap_to_second: user.position === 1 && second ? user.total_points - second.total_points : 0,
        rounds_needed: user.position > 1 ? Math.ceil(gap / 10) : 0,
        is_leader: user.position === 1,
      };
    },
    async getLeagueAveragePoints() {
      return deps.average();
    },
  };
}
export const { getLeaderComparison, getLeagueAveragePoints } = createLeagueComparisonService({
  standings: getSimpleStandings,
  average: queryLeagueAverage,
});
