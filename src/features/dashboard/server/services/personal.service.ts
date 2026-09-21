import 'server-only';
import {
  getManagerSeasonStatsData,
  getManagerSquadData,
  getManagerCaptainStats,
  getManagerHomeAwayStats,
  getManagerPersonalizedAlerts,
} from '@/features/managers/server';
import { getLeaderComparison } from '@/features/standings/server';
import type { PersonalDashboard } from '../../models/dashboard';

export const DASHBOARD_PERSONAL_POLICY = {
  access: 'caller-resolved-manager',
  serverCache: 'none',
  http: 'private-no-store',
} as const;
export function createPersonalDashboardService(deps: {
  season: typeof getManagerSeasonStatsData;
  squad: typeof getManagerSquadData;
  captain: typeof getManagerCaptainStats;
  homeAway: typeof getManagerHomeAwayStats;
  alerts: typeof getManagerPersonalizedAlerts;
  leader: typeof getLeaderComparison;
}) {
  return async function getUserDashboardData(userId: string | number): Promise<PersonalDashboard> {
    if (!userId) return { error: 'User ID required' };
    const [seasonStats, captainStats, homeAwayStats, alerts, squadDetails, leaderGap] =
      await Promise.all([
        deps.season(userId),
        deps.captain(userId),
        deps.homeAway(userId),
        deps.alerts(userId, 5),
        deps.squad(userId),
        deps.leader(String(userId)),
      ]);
    return { seasonStats, captainStats, homeAwayStats, alerts, squadDetails, leaderGap };
  };
}
export const getUserDashboardData = createPersonalDashboardService({
  season: getManagerSeasonStatsData,
  squad: getManagerSquadData,
  captain: getManagerCaptainStats,
  homeAway: getManagerHomeAwayStats,
  alerts: getManagerPersonalizedAlerts,
  leader: getLeaderComparison,
});
