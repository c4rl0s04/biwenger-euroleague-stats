import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server.ts', 'utf8');

const exports = `
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
`;

fs.writeFileSync('src/features/standings/server.ts', content + '\\n' + exports);
