export interface BottlerStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  wins: number;
  seconds: number;
  thirds: number;
  bottler_score: number;
}

export interface HeartbreakerStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  count: number;
  total_diff: number;
}

export interface NoGloryStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  total_points_no_glory: number;
  rounds_count: number;
}

export interface JinxStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  jinxed_count: number;
}

export interface EfficiencyStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  total_points: number;
  team_value: number;
  points_per_million: number;
}

export interface DetailedCaptainStat {
  user_id: string;
  user_name: string | null;
  user_icon: string | null;
  color_index: number | null;
  total_rounds: number;
  total_captain_points: number;
  avg_captain_points: number;
  success_rate: number;
  unique_captains: number;
  best_points: number;
  worst_points: number;
  most_used_captain: string | null;
  most_used_captain_id: number | null;
}
