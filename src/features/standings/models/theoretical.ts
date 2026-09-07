export interface TheoreticalGapStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  current_points: number;
  perfectTotal: number;
  gap: number;
  pct: number;
}
export interface LeagueComparisonStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  above_avg_count: number;
  below_avg_count: number;
  avg_diff: number;
}
export interface RivalryMatrixStat {
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
  }[];
  matrix: {
    [userId: number]: {
      [opponentId: number]: { wins: number; losses: number; ties: number };
    };
  };
}
export interface HeatmapStat {
  rounds: { id: number; name: string }[];
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
    scores: (number | null)[];
  }[];
}
export interface TheoreticalStandingsStat {
  user_id: string | number;
  name: string;
  icon: string;
  color_index: number;
  total_actual: number;
  total_ideal: number;
  gap: number;
  efficiency: number;
  rounds_played: number;
}
