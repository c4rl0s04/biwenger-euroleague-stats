export interface ManagerCaptainRecommendation {
  player_id: number;
  name: string;
  position: string | null;
  team_id: number | null;
  team: string | null;
  avg_recent_points: number | null;
  recent_games: number;
  recent_scores: string;
  form_label: string;
}

export type ManagerAlertType = 'price_gain' | 'price_loss' | 'good_performance';
export type ManagerAlertSeverity = 'success' | 'warning' | 'info' | 'error';

export interface ManagerPersonalizedAlert {
  type: ManagerAlertType;
  icon: string;
  message: string;
  severity: ManagerAlertSeverity;
}
