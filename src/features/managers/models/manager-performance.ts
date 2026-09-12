export interface ManagerCaptainStats {
  total_rounds: number;
  extra_points: number;
  avg_points: number;
  most_used: {
    player_id: number;
    name: string | null;
    times_captain: number;
    avg_as_captain: number;
    total_as_captain: number;
  }[];
  best_round: { name: string | null; points: number };
  worst_round: { name: string | null; points: number };
}

export interface ManagerHomeAwayStats {
  total_home: number;
  total_away: number;
  avg_home: number;
  avg_away: number;
  difference_pct: number;
}
