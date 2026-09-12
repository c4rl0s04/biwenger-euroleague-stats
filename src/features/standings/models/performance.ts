export interface VolatilityStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  avg_points: number;
  std_dev: number;
}
export interface HeatCheckStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  last5_avg: number;
  season_avg: number;
  diff: number;
  status: 'fire' | 'ice' | 'neutral';
}
export interface HunterStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  recent_points: number;
  gained: number;
}
export interface RollingAverageStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  data: {
    round: number;
    round_name: string | null;
    short_name: string;
    avg: number;
  }[];
}
export interface FloorCeilingStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  floor: number;
  ceiling: number;
  avg: number;
}
export interface PointDistributionStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  distribution: {
    [range: string]: number;
  };
}
export interface DominanceStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  wins: number;
  avg_margin: number;
}
export interface ReliabilityStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  total_rounds: number;
  rounds_above: number;
  pct: number;
}
export interface PositionChangeStat {
  rounds: { id: number; name: string | null; shortName: string }[];
  users: {
    id: string;
    name: string | null;
    icon: string | null;
    color_index: number | null;
    history: { position: number | undefined; change: number }[];
  }[];
  valid: boolean;
  stats: {
    biggestClimber: { name: string | null; change: number; round: string };
    biggestFaller: { name: string | null; change: number; round: string };
  };
}
