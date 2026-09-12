export interface TheoreticalGapStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  current_points: number;
  perfectTotal: number;
  gap: number;
  pct: number;
}
export interface LeagueComparisonStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  above_avg_count: number;
  below_avg_count: number;
  avg_diff: number;
}
export interface RivalryMatrixStat {
  users: {
    id: string;
    name: string | null;
    icon: string | null;
    color_index: number | null;
  }[];
  matrix: {
    [userId: string]: {
      [opponentId: string]: { wins: number; losses: number; ties: number };
    };
  };
}
export interface HeatmapStat {
  rounds: { id: number; name: string | null; shortName: string }[];
  users: {
    id: string;
    name: string | null;
    icon: string | null;
    color_index: number | null;
    scores: (number | null)[];
  }[];
}
export interface TheoreticalStandingsStat {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number | null;
  total_actual: number;
  total_ideal: number;
  gap: number;
  efficiency: number;
  rounds_played: number;
}
