export interface NormalizedPredictionRecord {
  user_id: string;
  usuario: string | null;
  user_icon: string | null;
  color_index: number;
  jornada: string;
  base_round_id: number;
  total_aciertos: string | number;
  result: string;
  is_partial: boolean;
  total_matches: string | number;
  user_matches: string | number;
}

export interface PredictableTeamRecord {
  id: number;
  name: string | null;
  img: string | null;
  total: string | number;
  correct: string | number;
  predicted_wins: string | number;
  predicted_losses: string | number;
  correct_wins: string | number;
  correct_losses: string | number;
  percentage: string | number;
}
