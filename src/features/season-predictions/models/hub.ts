import type { LeaderboardRow } from './leaderboard';
import type { PhaseResultsStatus, PhaseWindowStatus, PredictionPhase } from './phases';
import type { OutcomeStatus } from './preseason-scoring';
import type { PlayoffsPageData, SeasonPredictionsPageData } from './submission';

export const PHASE_TITLES: Record<PredictionPhase, string> = {
  preseason: 'Pretemporada',
  playoffs: 'Playoffs',
};

export interface PhaseSummary {
  phase: PredictionPhase;
  title: string;
  window: PhaseWindowStatus;
  results: PhaseResultsStatus;
  opensAt: string | null;
  locksAt: string | null;
  locksAtLabel: string | null;
}

export interface PreseasonQuestionResult {
  scored: boolean;
  status: OutcomeStatus;
  points: number;
  /** Real outcome in display form, or null while pending. */
  actual: string | null;
}

export interface PreseasonResultsView {
  points: number;
  provisional: boolean;
  questions: Record<string, PreseasonQuestionResult>;
}

export interface SeasonPredictionsHubData {
  seasonId: string;
  activePhase: PredictionPhase;
  phases: PhaseSummary[];
  preseason: SeasonPredictionsPageData;
  playoffs: PlayoffsPageData;
  /** The viewer's scored preseason answers; only once the preseason window is locked. */
  preseasonResults: PreseasonResultsView | null;
  /** Combined league table; only once at least one phase is locked. */
  leaderboard: LeaderboardRow[] | null;
}

export const HUB_SECTIONS = ['preseason', 'playoffs', 'leaderboard'] as const;
export type HubSection = (typeof HUB_SECTIONS)[number];

export const HUB_SECTION_TITLES: Record<HubSection, string> = {
  preseason: 'Pretemporada',
  playoffs: 'Playoffs',
  leaderboard: 'Clasificación de la porra',
};

export function isHubSection(value: string): value is HubSection {
  return (HUB_SECTIONS as readonly string[]).includes(value);
}
