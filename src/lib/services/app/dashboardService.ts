import 'server-only';
// Compatibility facade for Assistant and other unmigrated consumers (Tasks 08/09/20/25).
export {
  getNextRoundData,
  getUserDashboardData,
  getLeagueDashboardData,
  getStreakData,
  getRecentActivityData,
  fetchLeagueAveragePoints,
  fetchLastRoundMVPs,
  fetchRisingStars,
  fetchLeaderComparison,
  fetchTopPlayers,
  fetchPlayerBirthdays,
  fetchLastRoundStats,
  fetchTopPlayersByForm,
  fetchMarketOpportunities,
  fetchNextRound,
} from '@/features/dashboard/server';
export {
  getManagerCaptainStats as fetchCaptainStats,
  getManagerHomeAwayStats as fetchHomeAwayStats,
  getManagerCaptainRecommendations as fetchCaptainRecommendations,
} from '@/features/managers/server';
export { fetchLandingStats } from './news-landing-legacy';
