export interface RoundWinner {
  round_id: number;
  round_name: string | null;
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  points: number | null;
}

export interface PointsProgression {
  user_id: string;
  name: string | null;
  color_index: number | null;
  round_id: number;
  round_name: string | null;
  points: number | null;
  cumulative_points: number | null;
}

export interface StreakStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  longest_streak: number;
  current_streak: number;
}

export interface PlacementStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  top_3_count: number;
  bottom_3_count: number;
  total_rounds: number;
}
