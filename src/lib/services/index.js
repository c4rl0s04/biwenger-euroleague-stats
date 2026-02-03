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
} from './app/standingsService.js';

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
} from './app/dashboardService.js';

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
} from './core/playerService.js';

// Market Service
export {
  getMarketPageData,
  getMarketActivity,
  fetchMarketKPIs,
  fetchAllTransfers,
  fetchMarketTrends,
  fetchRecentTransfers,
  fetchMarketOpportunities,
} from './features/marketService.js';

// Team Service
export { fetchTeamProfile } from './core/teamService.js';

// Rounds Service
export {
  fetchRoundsList,
  fetchUserLineup,
  getCurrentRoundState,
  getUserPerformanceHistoryService,
  fetchRoundStandings,
  fetchRoundCompleteData,
} from './core/roundsService.js';

// Compare Service
export { getCompareData } from './features/compareService.js';

// Matches Service
export { fetchMatchesGrouped } from './app/matchesService.js';

// Schedule Service
export { getUserScheduleService } from './app/scheduleService.js';
