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
  last5_avg: Number(row.last5_avg),
  season_avg: Number(row.season_avg),
  diff: Number(row.diff),
  status: row.status as 'fire' | 'ice' | 'neutral',
});

export const mapHunterStat = (row: any): HunterStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  recent_points: Number(row.recent_points),
  gained: Number(row.gained),
});

export const mapRollingAverageStat = (row: any): RollingAverageStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  data: Array.isArray(row.data) ? row.data.map((d: any) => ({
    round: Number(d.round),
    round_name: String(d.round_name),
    avg: Number(d.avg),
  })) : [],
});

export const mapFloorCeilingStat = (row: any): FloorCeilingStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  floor: Number(row.floor),
  ceiling: Number(row.ceiling),
  avg: Number(row.avg),
});

export const mapPointDistributionStat = (row: any): PointDistributionStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  distribution: row.distribution || {},
});

export const mapDominanceStat = (row: any): DominanceStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  wins: Number(row.wins),
  avg_margin: Number(row.avg_margin),
});

export const mapPositionChangeStat = (row: any): PositionChangeStat => ({
  rounds: Array.isArray(row?.rounds) ? row.rounds.map((r: any) => ({
    id: Number(r.id),
    name: String(r.name),
  })) : [],
  users: Array.isArray(row?.users) ? row.users.map((u: any) => ({
    id: Number(u.id),
    name: String(u.name),
    icon: u.icon ? String(u.icon) : '',
    color_index: Number(u.color_index),
    history: Array.isArray(u.history) ? u.history.map((h: any) => ({
      position: Number(h.position),
      change: Number(h.change),
    })) : [],
  })) : [],
  valid: Boolean(row?.valid),
  stats: row?.stats ? {
    biggestClimber: {
      name: String(row.stats.biggestClimber?.name || ''),
      change: Number(row.stats.biggestClimber?.change || 0),
      round: String(row.stats.biggestClimber?.round || ''),
    },
    biggestFaller: {
      name: String(row.stats.biggestFaller?.name || ''),
      change: Number(row.stats.biggestFaller?.change || 0),
      round: String(row.stats.biggestFaller?.round || ''),
    },
  } : { biggestClimber: { name: '', change: 0, round: '' }, biggestFaller: { name: '', change: 0, round: '' } },
});

export const mapReliabilityStat = (row: any): ReliabilityStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  total_rounds: Number(row.total_rounds),
  rounds_above: Number(row.rounds_above),
  pct: Number(row.pct),
});
`;

fs.writeFileSync('src/features/standings/server/mappers/performance.mapper.ts', content);
