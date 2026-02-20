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
  fetchRoundWinners,
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
  fetchPointsProgression,
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchRollingAverageStats,
  fetchFloorCeilingStats,
  fetchPointDistributionStats,
  fetchAllPlayAllStats,
  fetchDominanceStats,
  fetchTheoreticalGapStats,
  fetchHeatmapStats,
  fetchPositionChangesStats,
  fetchReliabilityStats,
  fetchRivalryMatrixStats,
} from './app/standingsService';

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
  fetchTopPlayersByForm,
  fetchCaptainRecommendations,
  fetchNextRound,
} from './app/dashboardService';

// Player Service
export {
  getPlayerProfile,
  getPlayerPerformanceSummary,
  searchPlayers,
  getTopPerformers,
  fetchPlayerStreaks,
  fetchAllPlayers,
} from './core/playerService';

// Market Service (Features)
export {
  getMarketPageData,
  getMarketActivity,
  fetchMarketKPIs,
  fetchAllTransfers,
  fetchMarketTrends,
  fetchRecentTransfers,
  fetchMarketOpportunities,
} from './features/marketService';

// Market Service (Root)
export {
  fetchMarketStats,
  fetchLiveMarketTransfers,
} from './marketService';

// User Service
export {
  fetchAllUsers,
  fetchUserSeasonStats,
  fetchUserRecentRounds,
  fetchUserSquadDetails,
} from './core/userService';

// Tournament Service
export * from './tournamentService';

// Stats Service
export * from './statsService';

// Team Service
export { fetchTeamProfile } from './core/teamService';

// Rounds Service
export {
  fetchRoundsList,
  fetchUserLineup,
  getCurrentRoundState,
  getUserPerformanceHistoryService,
  fetchRoundStandings,
  fetchRoundCompleteData,
  fetchRoundLeaderboard,
  fetchAllUsersPerformanceHistory,
  fetchUserRoundDetails,
} from './core/roundsService';

// Compare Service
export { getCompareData } from './features/compareService';

// Matches Service
export { fetchMatchesGrouped } from './app/matchesService';

// Schedule Service
export { getUserScheduleService, fetchScheduleRounds } from './app/scheduleService';

// Search Service
export { performGlobalSearch } from './features/searchService';

// Player Service Extensions
export { fetchStatLeaders } from './core/playerService';

// Dashboard Extensions
export { fetchLandingStats, fetchNewsFeed } from './app/dashboardService';
