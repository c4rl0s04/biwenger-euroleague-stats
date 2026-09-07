export interface BottlerStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  wins: number;
  seconds: number;
  thirds: number;
  bottler_score: number;
}

export interface HeartbreakerStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  count: number;
  total_diff: number;
}

export interface NoGloryStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_points_no_glory: number;
  rounds_count: number;
}

export interface JinxStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  jinxed_count: number;
}

export interface EfficiencyStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_points: number;
  team_value: number;
  points_per_million: number;
}

export interface DetailedCaptainStat {
  user_id: string;
  user_name: string;
  user_icon: string;
  color_index: number;
  total_rounds: number;
  total_captain_points: number;
  avg_captain_points: number;
  success_rate: number;
  unique_captains: number;
  best_points: number;
  worst_points: number;
  most_used_captain: string;
  most_used_captain_id: number;
}
