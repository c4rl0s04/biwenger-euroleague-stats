import 'server-only';
import { fetchStreakStats, getLeagueAveragePoints } from '@/features/standings/server';
import { getLastRoundMVPs, getLastRoundStats } from '@/features/rounds/server';
import { getDashboardPlayerBirthdays } from '@/features/players/server';
import { mapDashboardIdealLineup } from '../mappers/dashboard.mapper';
import type { LeagueDashboard, DashboardDisplayPlayer } from '../../models/dashboard';

export const DASHBOARD_LEAGUE_POLICY = {
  access: 'public-fantasy-statistics',
  serverCache: 'none',
  httpSeconds: 300,
  emptyLineupHttpSeconds: 60,
} as const;
export function createLeagueDashboardService(deps: {
  streaks: typeof fetchStreakStats;
  average: typeof getLeagueAveragePoints;
  mvps: typeof getLastRoundMVPs;
  birthdays: typeof getDashboardPlayerBirthdays;
  stats: typeof getLastRoundStats;
}) {
  return {
    async getLeagueDashboardData(): Promise<LeagueDashboard> {
      const [, leagueAverage, roundMVPs, upcomingBirthdays] = await Promise.all([
        deps.streaks(),
        deps.average(),
        deps.mvps(5),
        deps.birthdays(),
      ]);
      // Legacy input is a manager streak array, not a {hot,cold} player object.
      // Preserve the existing empty widgets and the read/error behavior; don't change its source here.
      return { leagueAverage, roundMVPs, upcomingBirthdays, hotStreaks: [], coldStreaks: [] };
    },
    async getStreakData(_type: 'hot' | 'cold', _limit = 5): Promise<DashboardDisplayPlayer[]> {
      await deps.streaks();
      return [];
    },
    async getDashboardIdealLineup() {
      const players = await deps.stats();
      return { data: mapDashboardIdealLineup(players), cacheSeconds: players?.length ? 300 : 60 };
    },
  };
}
export const { getLeagueDashboardData, getStreakData, getDashboardIdealLineup } =
  createLeagueDashboardService({
    streaks: fetchStreakStats,
    average: getLeagueAveragePoints,
    mvps: getLastRoundMVPs,
    birthdays: getDashboardPlayerBirthdays,
    stats: getLastRoundStats,
  });
