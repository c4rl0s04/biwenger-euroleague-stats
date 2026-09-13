import type { NormalizedPrediction, PredictableTeam } from '../../models/predictions';
import type {
  NormalizedPredictionRecord,
  PredictableTeamRecord,
} from '../queries/prediction.records';

export function mapNormalizedPrediction(row: NormalizedPredictionRecord): NormalizedPrediction {
  return {
    user_id: row.user_id,
    usuario: row.usuario,
    user_icon: row.user_icon,
    color_index: row.color_index,
    jornada: row.jornada,
    base_round_id: row.base_round_id,
    result: row.result,
    aciertos: parseInt(String(row.total_aciertos)),
    total_matches: parseInt(String(row.total_matches)),
    user_matches: parseInt(String(row.user_matches)),
    is_partial: row.is_partial === true,
  };
}

export function mapPredictableTeam(row: PredictableTeamRecord): PredictableTeam {
  return {
    id: row.id,
    name: row.name,
    img: row.img,
    total: parseInt(String(row.total)),
    correct: parseInt(String(row.correct)),
    predicted_wins: parseInt(String(row.predicted_wins)),
    predicted_losses: parseInt(String(row.predicted_losses)),
    correct_wins: parseInt(String(row.correct_wins)),
    correct_losses: parseInt(String(row.correct_losses)),
    percentage: parseFloat(String(row.percentage)),
  };
}
