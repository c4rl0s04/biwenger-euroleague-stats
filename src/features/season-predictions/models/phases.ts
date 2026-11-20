// Each season holds one prediction window per phase; mirrors the
// season_prediction_window_phase CHECK constraint in drizzle/0021_prediction_phases.sql.
export const PREDICTION_PHASES = ['preseason', 'playoffs'] as const;

export type PredictionPhase = (typeof PREDICTION_PHASES)[number];

export type PhaseWindowStatus = 'not-open' | 'open' | 'locked';
export type PhaseResultsStatus = 'pending' | 'provisional' | 'final';

export interface PhaseState {
  phase: PredictionPhase;
  window: PhaseWindowStatus;
  results: PhaseResultsStatus;
}

/** Open phase if any, else the latest locked phase whose results are not final, else preseason. */
export function pickActivePhase(states: readonly PhaseState[]): PredictionPhase {
  const byOrder = [...states].sort(
    (left, right) => PREDICTION_PHASES.indexOf(right.phase) - PREDICTION_PHASES.indexOf(left.phase)
  );
  return (
    byOrder.find((state) => state.window === 'open')?.phase ??
    byOrder.find((state) => state.window === 'locked' && state.results !== 'final')?.phase ??
    'preseason'
  );
}
