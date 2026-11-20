import type { PredictionAnswer, PredictionAnswers } from './questions';

/** Proposed values from the approved plan; points are computed at read time, so changing them rescores history. */
export const PRESEASON_SCORING = { single: 5, rankingExact: 2, rankingNear: 1 } as const;

export type PreseasonQuestionScoring = 'single' | 'ranking' | 'none';

// Subjective questions are shown but never score. IDs missing from this map are unscored.
export const PRESEASON_QUESTION_SCORING: Readonly<Record<string, PreseasonQuestionScoring>> = {
  'player-total-points': 'single',
  'player-round-leader': 'single',
  'player-best-round': 'single',
  'player-underrated': 'none',
  'player-overrated': 'none',
  'team-ranking': 'ranking',
  'team-champion': 'single',
  'team-underrated': 'none',
  'team-overrated': 'none',
  'manager-ranking': 'ranking',
  'manager-round-wins': 'single',
  'manager-best-round': 'single',
};

export type OutcomeStatus = 'pending' | 'provisional' | 'final';

/** Actual result of one question. Ranking positions use competition ranking: ties share the top position (1, 2, 2, 4). */
export type QuestionOutcome =
  | { kind: 'single'; status: OutcomeStatus; leaderIds: string[] }
  | { kind: 'ranking'; status: OutcomeStatus; standings: { id: string; position: number }[] };

export type PreseasonOutcomes = Record<string, QuestionOutcome>;

export interface QuestionScore {
  scored: boolean;
  status: OutcomeStatus;
  points: number;
}

export interface PreseasonScore {
  points: number;
  /** True while any scored question is not final. */
  provisional: boolean;
  questions: Record<string, QuestionScore>;
}

const PENDING_SINGLE: QuestionOutcome = { kind: 'single', status: 'pending', leaderIds: [] };

/** Each id's inclusive position range; tied ids share the range their tie occupies. */
function positionRanges(standings: { id: string; position: number }[]) {
  const tieSize = new Map<number, number>();
  for (const { position } of standings) tieSize.set(position, (tieSize.get(position) ?? 0) + 1);
  return new Map(
    standings.map(({ id, position }) => [
      id,
      { min: position, max: position + (tieSize.get(position) ?? 1) - 1 },
    ])
  );
}

function scoreAnswer(answer: PredictionAnswer | undefined, outcome: QuestionOutcome): number {
  if (!answer || outcome.status === 'pending' || answer.kind !== outcome.kind) return 0;
  if (answer.kind === 'single' && outcome.kind === 'single')
    return outcome.leaderIds.includes(answer.id) ? PRESEASON_SCORING.single : 0;
  if (answer.kind !== 'ranking' || outcome.kind !== 'ranking') return 0;
  const ranges = positionRanges(outcome.standings);
  return answer.ids.reduce((total, id, index) => {
    const range = ranges.get(id);
    if (!range) return total;
    const predicted = index + 1;
    const distance = Math.max(range.min - predicted, predicted - range.max, 0);
    if (distance === 0) return total + PRESEASON_SCORING.rankingExact;
    return distance === 1 ? total + PRESEASON_SCORING.rankingNear : total;
  }, 0);
}

export function scorePreseason(
  answers: PredictionAnswers,
  outcomes: PreseasonOutcomes
): PreseasonScore {
  const questions: Record<string, QuestionScore> = {};
  let points = 0;
  let provisional = false;
  for (const id of Array.from(
    new Set([...Object.keys(PRESEASON_QUESTION_SCORING), ...Object.keys(answers)])
  )) {
    const scoring = PRESEASON_QUESTION_SCORING[id] ?? 'none';
    const outcome = outcomes[id] ?? PENDING_SINGLE;
    if (scoring === 'none') {
      questions[id] = { scored: false, status: outcome.status, points: 0 };
      continue;
    }
    const questionPoints = scoreAnswer(answers[id], outcome);
    questions[id] = { scored: true, status: outcome.status, points: questionPoints };
    points += questionPoints;
    if (outcome.status !== 'final') provisional = true;
  }
  return { points, provisional, questions };
}
