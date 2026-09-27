import 'server-only';
export {
  getLeaderComparison,
  getLeagueAveragePoints,
  LEAGUE_COMPARISON_POLICY,
} from './server/services/league-comparison.service';

export {
  getFullStandings,
  getSimpleStandings,
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

export { getStandingsOverview, getStandingsSection } from './server/services/screens.service';

export {
  getRequestStandings,
  REQUEST_STANDINGS_POLICY,
} from './server/services/request-standings.service';
export { getSimpleStandings as getLandingStandings } from './server/services/base-standings.service';
