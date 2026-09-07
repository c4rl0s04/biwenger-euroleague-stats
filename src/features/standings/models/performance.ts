export interface VolatilityStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  avg_points: number;
  std_dev: number;
}
export interface HeatCheckStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  last5_avg: number;
  season_avg: number;
  diff: number;
  status: 'fire' | 'ice' | 'neutral';
}
export interface HunterStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  recent_points: number;
  gained: number;
}
export interface RollingAverageStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  data: {
    round: number;
    round_name: string;
    avg: number;
  }[];
}
export interface FloorCeilingStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  floor: number;
  ceiling: number;
  avg: number;
}
export interface PointDistributionStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  distribution: {
    [range: string]: number;
  };
}
export interface DominanceStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  wins: number;
  avg_margin: number;
}
export interface ReliabilityStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_rounds: number;
  rounds_above: number;
  pct: number;
}
export interface PositionChangeStat {
  rounds: { id: number; name: string }[];
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
    history: { position: number; change: number }[];
  }[];
  valid: boolean;
  stats: {
    biggestClimber: { name: string; change: number; round: string };
    biggestFaller: { name: string; change: number; round: string };
  };
}
