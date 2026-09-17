import 'server-only';
export { getPredictionSection } from './server/services/prediction-screen.service';

export {
  getPorrasStats,
  getNormalizedPredictions,
  getPredictableTeams,
  PREDICTION_READ_POLICY,
} from './server/services/predictions-read.service';
// Shared conceptual-round SQL contract used by Home feed; always binds season at $1.
export { PREDICTION_NORMALIZATION_CTES } from './server/queries/prediction-normalization-sql';

export {
  getAchievements,
  getParticipation,
  getPerformanceData,
  getTableStats,
  getClutchStats,
  getVictorias,
  getBestRoundStat,
  getHistoryPivot,
} from './server/calculations/predictions';
