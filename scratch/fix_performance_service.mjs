import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/services/performance.service.ts', 'utf8');

content = content.replace(/queryVolatilityStats/g, 'getVolatilityStats');
content = content.replace(/queryHeatCheckStats/g, 'getHeatCheckStats');
content = content.replace(/queryHunterStats/g, 'getHunterStats');
content = content.replace(/queryRollingAverageStats/g, 'getRollingAverageStats');
content = content.replace(/queryFloorCeilingStats/g, 'getFloorCeilingStats');
content = content.replace(/queryPointDistributionStats/g, 'getPointDistributionStats');
content = content.replace(/queryDominanceStats/g, 'getDominanceStats');
content = content.replace(/queryPositionChangesStats/g, 'getPositionChangesStats');
content = content.replace(/queryReliabilityStats/g, 'getReliabilityStats');

fs.writeFileSync('src/features/standings/server/services/performance.service.ts', content);

