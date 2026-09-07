import 'server-only';

export {
  getFullStandings,
  fetchValueRanking,
  getLeagueOverview,
  STANDINGS_ACCESS_POLICY,
  STANDINGS_CACHE_POLICY,
} from './server/services/base-standings.service';
export { parseStandingsSearchParams } from './validation/standings-input';
export { fetchAllPlayAllStats, ALL_PLAY_ALL_POLICY } from './server/services/all-play-all.service';

export {
  fetchRoundWinners,
  fetchPointsProgression,
  fetchStreakStats,
  fetchPlacementStats,
} from './server/services/progression.service';

export {
  fetchBottlerStats,
  fetchHeartbreakerStats,
  fetchNoGloryStats,
  fetchJinxStats,
  fetchEfficiencyStats,
  fetchDetailedCaptainStats,
} from './server/services/curiosities.service';

export {
  fetchInitialSquadAnalytics,
  fetchInitialSquadStats,
} from './server/services/draft.service';

export {
  fetchVolatilityStats,
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchRollingAverageStats,
  fetchFloorCeilingStats,
  fetchPointDistributionStats,
  fetchDominanceStats,
  fetchPositionChangesStats,
  fetchReliabilityStats,
} from './server/services/performance.service';

export {
  fetchTheoreticalGapStats,
  fetchLeagueComparisonStats,
  fetchRivalryMatrixStats,
  fetchHeatmapStats,
  fetchTheoreticalStandings,
} from './server/services/theoretical.service';

// Legacy adapters
export {
  getVolatilityStats,
  getPlacementStats,
  getLeagueComparisonStats,
  getEfficiencyStats,
  getStreakStats,
  getBottlerStats,
  getHeartbreakerStats,
  getNoGloryStats,
  getJinxStats,
} from './server/queries/performance.query';

export {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getReliabilityStats,
  getPointDistributionStats,
  getAllPlayAllStats,
  getDominanceStats,
  getTheoreticalGapStats,
  getHeatmapStats,
  getPositionChangesStats,
  getRivalryMatrixStats,
  getCaptainStats,
  getDetailedCaptainStats,
} from './server/queries/advanced.query';

export {
  getInitialSquadActualPerformance,
  getBestInitialSquadPlayer,
  getInitialSquadRetainedPoints,
  getInitialSquadRetainedBreakdown,
  getInitialSquadRegret,
  getInitialSquadLoyalty,
  getInitialSquadPotentialAdvanced,
  getInitialSquadsDetailed,
} from './server/queries/draft.query';

export {
  getExtendedStandings,
  getRoundWinners,
  getLeagueTotals,
  getPointsProgression,
  getValueRanking,
  getWinCounts,
  getSimpleStandings,
  getLeaderComparison,
  getLeagueAveragePoints,
} from './server/queries/base.query';
