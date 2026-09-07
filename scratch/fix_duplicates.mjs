import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/services/performance.service.ts', 'utf8');

// The file has two identical blocks of `import { getHeatCheckStats... } from '../queries/advanced.query'`
// Let's just rewrite the imports cleanly
const cleanImports = `import 'server-only';
import { cache } from 'react';
import {
  mapVolatilityStat,
  mapHeatCheckStat,
  mapHunterStat,
  mapRollingAverageStat,
  mapFloorCeilingStat,
  mapPointDistributionStat,
  mapDominanceStat,
  mapPositionChangeStat,
  mapReliabilityStat,
} from '../mappers/performance.mapper';
import { getVolatilityStats } from '../queries/performance.query';
import {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getDominanceStats,
  getPositionChangesStats,
  getReliabilityStats,
} from '../queries/advanced.query';`;

content = content.replace(/import 'server-only';[\s\S]*?from '\.\.\/queries\/advanced\.query';/m, cleanImports);
// Because there was another duplicate block, we can just replace ALL up to the first export with the cleanImports.
content = content.replace(/^[\s\S]*?(?=export const fetchVolatilityStats)/, cleanImports + '\\n\\n');

fs.writeFileSync('src/features/standings/server/services/performance.service.ts', content);

