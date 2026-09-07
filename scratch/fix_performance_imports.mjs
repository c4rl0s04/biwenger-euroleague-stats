import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/services/performance.service.ts', 'utf8');

content = content.replace(/\} from '\.\.\/queries\/performance\.query';/g, `  getVolatilityStats,
} from '../queries/performance.query';
import {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getDominanceStats,
  getPositionChangesStats,
  getReliabilityStats,
} from '../queries/advanced.query';`);

// Wait, the original import block was:
// import {
//   getVolatilityStats,
//   getHeatCheckStats, ...
// } from '../queries/performance.query';

content = content.replace(/import \{\n  getVolatilityStats,[\s\S]*?\} from '\.\.\/queries\/performance\.query';/, `import { getVolatilityStats } from '../queries/performance.query';
import {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getDominanceStats,
  getPositionChangesStats,
  getReliabilityStats,
} from '../queries/advanced.query';`);

fs.writeFileSync('src/features/standings/server/services/performance.service.ts', content);

