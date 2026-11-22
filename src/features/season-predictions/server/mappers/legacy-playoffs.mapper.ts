import type { BracketAnswers, BracketResult } from '../../models/bracket';
import type { LegacyPlayoffRows } from '../queries/legacy-playoffs.query';

export type LegacyBracketResults = Record<
  string,
  Pick<BracketResult, 'complete' | 'winner' | 'score'>
>;

export interface LegacyPlayoffs {
  answersByUser: Map<string, BracketAnswers>;
  results: LegacyBracketResults;
  imageByUser: Map<string, string | null>;
}

/**
 * Maps legacy 2025-26 rows onto the bracket shapes so scoreBracket can score them.
 * Legacy match ids are the template slot ids. Legacy picks were made per tie without
 * propagation and never predicted series scores, so answers are not re-validated and
 * scores are left out (no series bonus, as in the legacy scoring).
 */
export function mapLegacyPlayoffs(rows: LegacyPlayoffRows): LegacyPlayoffs {
  const answersByUser = new Map<string, BracketAnswers>();
  for (const prediction of rows.predictions) {
    const answers = answersByUser.get(prediction.userId) ?? {};
    answers[prediction.matchId] = { winner: String(prediction.predictedWinnerId) };
    answersByUser.set(prediction.userId, answers);
  }
  const results: LegacyBracketResults = {};
  for (const result of rows.results) {
    const complete = result.isCompleted === true;
    results[result.matchId] = {
      complete,
      winner: complete && result.winnerId !== null ? String(result.winnerId) : null,
      score: null,
    };
  }
  return {
    answersByUser,
    results,
    imageByUser: new Map(rows.media.map((row) => [row.userId, row.predictionImageUrl])),
  };
}
