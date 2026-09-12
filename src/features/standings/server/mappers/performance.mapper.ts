import 'server-only';
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

export const mapVolatilityStat = (row: VolatilityStat): VolatilityStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  avg_points: row.avg_points,
  std_dev: row.std_dev,
});

export const mapHeatCheckStat = (row: HeatCheckStat): HeatCheckStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  last5_avg: row.last5_avg,
  season_avg: row.season_avg,
  diff: row.diff,
  status: row.status,
});

export const mapHunterStat = (row: HunterStat): HunterStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  recent_points: row.recent_points,
  gained: row.gained,
});

export const mapFloorCeilingStat = (row: FloorCeilingStat): FloorCeilingStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  floor: row.floor,
  ceiling: row.ceiling,
  avg: row.avg,
});

export const mapDominanceStat = (row: DominanceStat): DominanceStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  wins: row.wins,
  avg_margin: row.avg_margin,
});

export const mapReliabilityStat = (row: ReliabilityStat): ReliabilityStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  total_rounds: row.total_rounds,
  rounds_above: row.rounds_above,
  pct: row.pct,
});

export const mapRollingAverageStat = (row: RollingAverageStat): RollingAverageStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  data: row.data.map((d) => ({
    round: d.round,
    round_name: d.round_name,
    short_name: d.short_name,
    avg: d.avg,
  })),
});
export const mapPointDistributionStat = (row: PointDistributionStat): PointDistributionStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  distribution: {
    '90-135': row.distribution['90-135'],
    '136-170': row.distribution['136-170'],
    '171-205': row.distribution['171-205'],
    '206+': row.distribution['206+'],
  },
});
export const mapPositionChangeStat = (row: PositionChangeStat): PositionChangeStat => ({
  rounds: row.rounds.map((r) => ({ id: r.id, name: r.name, shortName: r.shortName })),
  users: row.users.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    color_index: u.color_index,
    history: u.history.map((h) => ({ position: h.position, change: h.change })),
  })),
  valid: row.valid,
  stats: {
    biggestClimber: {
      name: row.stats.biggestClimber.name,
      change: row.stats.biggestClimber.change,
      round: row.stats.biggestClimber.round,
    },
    biggestFaller: {
      name: row.stats.biggestFaller.name,
      change: row.stats.biggestFaller.change,
      round: row.stats.biggestFaller.round,
    },
  },
});
