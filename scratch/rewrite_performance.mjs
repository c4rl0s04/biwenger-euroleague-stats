import fs from 'fs';

let content = `import 'server-only';
import type {
  VolatilityStat,
  HeatCheckStat,
  HunterStat,
  RollingAverageStat,
  FloorCeilingStat,
  PointDistributionStat,
  DominanceStat,
  PositionChangeStat,
  ReliabilityStat,
} from '../../models/performance';

export const mapVolatilityStat = (row: any): VolatilityStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  avg_points: Number(row.avg_points),
  std_dev: Number(row.std_dev),
});

export const mapHeatCheckStat = (row: any): HeatCheckStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  best_3_round_streak: Number(row.best_3_round_streak),
});

export const mapHunterStat = (row: any): HunterStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  points_behind_leader: Number(row.points_behind_leader),
});

export const mapRollingAverageStat = (row: any): RollingAverageStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  last_5_avg: Number(row.last_5_avg),
});

export const mapFloorCeilingStat = (row: any): FloorCeilingStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  floor: Number(row.floor),
  ceiling: Number(row.ceiling),
});

export const mapPointDistributionStat = (row: any): PointDistributionStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  percentiles: row.percentiles ? {
    p25: Number(row.percentiles.p25),
    p50: Number(row.percentiles.p50),
    p75: Number(row.percentiles.p75),
  } : { p25: 0, p50: 0, p75: 0 },
});

export const mapDominanceStat = (row: any): DominanceStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  rounds_as_leader: Number(row.rounds_as_leader),
});

export const mapPositionChangeStat = (row: any): PositionChangeStat => ({
  changes: Array.isArray(row?.changes) ? row.changes.map((c: any) => ({
    user_id: Number(c.user_id),
    name: String(c.name),
    icon: c.icon ? String(c.icon) : '',
    color_index: Number(c.color_index),
    round_id: Number(c.round_id),
    position: Number(c.position),
  })) : [],
});

export const mapReliabilityStat = (row: any): ReliabilityStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  consistency_score: Number(row.consistency_score),
});
`;

fs.writeFileSync('src/features/standings/server/mappers/performance.mapper.ts', content);

let serviceContent = fs.readFileSync('src/features/standings/server/services/performance.service.ts', 'utf8');
serviceContent = serviceContent.replace(/export async function/g, 'export const');
serviceContent = serviceContent.replace(/fetchVolatilityStats\(\) \{/g, 'fetchVolatilityStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchHeatCheckStats\(\) \{/g, 'fetchHeatCheckStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchHunterStats\(\) \{/g, 'fetchHunterStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchRollingAverageStats\(\) \{/g, 'fetchRollingAverageStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchFloorCeilingStats\(\) \{/g, 'fetchFloorCeilingStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchPointDistributionStats\(\) \{/g, 'fetchPointDistributionStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchDominanceStats\(\) \{/g, 'fetchDominanceStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchPositionChangesStats\(\) \{/g, 'fetchPositionChangesStats = cache(async () => {');
serviceContent = serviceContent.replace(/fetchReliabilityStats\(\) \{/g, 'fetchReliabilityStats = cache(async () => {');
serviceContent = serviceContent.replace(/\}\n/g, '});\n');
serviceContent = `import { cache } from 'react';\n` + serviceContent;

fs.writeFileSync('src/features/standings/server/services/performance.service.ts', serviceContent);
