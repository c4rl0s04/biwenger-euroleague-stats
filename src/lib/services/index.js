/**
 * Services Barrel Export
 * Central export for all service modules
 *
 * @example
 * import { getFullStandings, fetchCaptainStats } from '@/lib/services';
 */

// Standings Service
export {
  getFullStandings,
  getLeagueOverview,
  getStandingsPageData,
  getUserPositionData,
  fetchRoundWinners,
  fetchPointsProgression,
  fetchValueRanking,
  fetchStreakStats,
  fetchVolatilityStats,
  fetchEfficiencyStats,
  fetchPlacementStats,
  fetchBottlerStats,
  fetchHeartbreakerStats,
  fetchNoGloryStats,
  fetchJinxStats,
  fetchInitialSquadAnalytics,
  fetchLeagueComparisonStats,
} from './standingsService';

// Dashboard Service
export {
  getNextRoundData,
  getUserDashboardData,
  getLeagueDashboardData,
  getStreakData,
  getRecentActivityData,
  fetchCaptainStats,
  fetchHomeAwayStats,
  fetchLeagueAveragePoints,
  fetchLastRoundMVPs,
  fetchRisingStars,
  fetchStandingsPreview,
  fetchLeaderComparison,
  fetchTopPlayers,
  fetchPlayerBirthdays,
  fetchLastRoundStats,
} from './dashboardService';

// Player Service
export {
  getPlayerProfile,
  getPlayerPerformanceSummary,
  searchPlayers,
  getTopPerformers,
  fetchUserSeasonStats,
  fetchUserRecentRounds,
  fetchUserSquadDetails,
  fetchPlayerStreaks,
} from './playerService';

// Market Service
export {
  getMarketPageData,
  getMarketActivity,
  fetchMarketKPIs,
  fetchAllTransfers,
  fetchMarketTrends,
  fetchRecentTransfers,
  fetchMarketOpportunities,
} from './marketService';

