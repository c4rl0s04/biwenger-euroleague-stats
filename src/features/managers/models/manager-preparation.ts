export interface ManagerCaptainRecommendation {
  player_id: number;
  name: string | null;
  position: string | null;
  team_id: number | null;
  team: string | null;
  avg_recent_points: number;
  recent_games: number;
  recent_scores: string;
  form_label: string;
}

export interface ManagerPersonalizedAlert {
  type: string;
  icon: string;
  message: string;
  severity: 'success' | 'warning' | 'info' | 'error';
}
