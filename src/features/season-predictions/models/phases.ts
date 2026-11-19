// Each season holds one prediction window per phase; mirrors the
// season_prediction_window_phase CHECK constraint in drizzle/0021_prediction_phases.sql.
export const PREDICTION_PHASES = ['preseason', 'playoffs'] as const;

export type PredictionPhase = (typeof PREDICTION_PHASES)[number];
