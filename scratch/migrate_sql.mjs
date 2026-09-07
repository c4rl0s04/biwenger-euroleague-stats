import fs from 'fs';

fs.renameSync('src/lib/db/queries/analytics/performance.ts', 'src/features/standings/server/queries/performance.query.ts');
fs.renameSync('src/lib/db/queries/analytics/advanced_stats.ts', 'src/features/standings/server/queries/advanced.query.ts');
fs.renameSync('src/lib/db/queries/analytics/initial_squads.ts', 'src/features/standings/server/queries/draft.query.ts');

function fixImports(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from '\.\.\/\.\.\/index'/g, "from '@/lib/db'");
  content = content.replace(/from '\.\.\/\.\.\/\.\.\/utils\/cache'/g, "from '@/lib/utils/cache'");
  content = content.replace(/from '\.\.\/\.\.\/\.\.\/utils\/format'/g, "from '@/lib/utils/format'");
  content = content.replace(/from '\.\.\/\.\.\/season-context'/g, "from '@/lib/db/season-context'");
  content = content.replace(/from '\.\.\/\.\.\/schema'/g, "from '@/lib/db/schema'");
  content = "import 'server-only';\n" + content;
  fs.writeFileSync(file, content);
}

fixImports('src/features/standings/server/queries/performance.query.ts');
fixImports('src/features/standings/server/queries/advanced.query.ts');
fixImports('src/features/standings/server/queries/draft.query.ts');

fs.writeFileSync('src/lib/db/queries/analytics/performance.ts', "export { getVolatilityStats, getPlacementStats, getLeagueComparisonStats, getEfficiencyStats, getStreakStats, getBottlerStats, getHeartbreakerStats, getNoGloryStats, getJinxStats } from '@/features/standings/server';");
fs.writeFileSync('src/lib/db/queries/analytics/advanced_stats.ts', "export { getHeatCheckStats, getHunterStats, getRollingAverageStats, getFloorCeilingStats, getReliabilityStats, getPointDistributionStats, getAllPlayAllStats, getDominanceStats, getTheoreticalGapStats, getHeatmapStats, getPositionChangesStats, getRivalryMatrixStats, getCaptainStats, getDetailedCaptainStats } from '@/features/standings/server';");
fs.writeFileSync('src/lib/db/queries/analytics/initial_squads.ts', "export { getInitialSquadActualPerformance, getBestInitialSquadPlayer, getInitialSquadRetainedPoints, getInitialSquadRetainedBreakdown, getInitialSquadRegret, getInitialSquadLoyalty, getInitialSquadPotentialAdvanced, getInitialSquadsDetailed } from '@/features/standings/server';");

