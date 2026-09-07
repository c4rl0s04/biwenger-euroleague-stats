export interface RoundWinner {
  round_id: number;
  round_name: string;
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  points: number;
}

export interface PointsProgression {
  user_id: number;
  name: string;
  color_index: number;
  round_id: number;
  round_name: string;
  points: number;
  cumulative_points: number;
}

export interface StreakStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  longest_streak: number;
  current_streak: number;
}

export interface PlacementStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  top_3_count: number;
  bottom_3_count: number;
  total_rounds: number;
}
