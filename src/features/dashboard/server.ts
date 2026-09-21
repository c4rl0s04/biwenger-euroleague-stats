import 'server-only';

export {
  getUserDashboardData,
  DASHBOARD_PERSONAL_POLICY,
} from './server/services/personal.service';
export {
  getLeagueDashboardData,
  getStreakData,
  getDashboardIdealLineup,
  DASHBOARD_LEAGUE_POLICY,
} from './server/services/league.service';
export {
  getNextRoundData,
  fetchNextRound,
  DASHBOARD_NEXT_ROUND_POLICY,
} from './server/services/next-round.service';
export {
  getRecentActivityData,
  getRecentRecords,
  DASHBOARD_ACTIVITY_POLICY,
} from './server/services/activity.service';
export { parseActivityUserId } from './validation/activity-input';

// Deliberate widget facade: implementations remain in their owning domains and
// are shared with aggregate services. No duplicate queries or additional cache.
export {
  getDashboardPlayerBirthdays as fetchPlayerBirthdays,
  getDashboardRisingStars as fetchRisingStars,
  getDashboardTopPlayers as fetchTopPlayers,
  getDashboardTopPlayersByForm as fetchTopPlayersByForm,
} from '@/features/players/server';
export {
  getLastRoundMVPs as fetchLastRoundMVPs,
  getLastRoundStats as fetchLastRoundStats,
} from '@/features/rounds/server';
export {
  getLeaderComparison as fetchLeaderComparison,
  getLeagueAveragePoints as fetchLeagueAveragePoints,
} from '@/features/standings/server';
export { getMarketOpportunities as fetchMarketOpportunities } from '@/features/market/server';
