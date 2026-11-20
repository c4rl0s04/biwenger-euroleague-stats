import { describe, expect, it } from 'vitest';
import {
  PRESEASON_QUESTION_SCORING,
  PRESEASON_SCORING,
  scorePreseason,
  type PreseasonOutcomes,
} from './preseason-scoring';
import { PREDICTION_QUESTIONS } from './questions';

const single = (leaderIds: string[], status: 'provisional' | 'final' = 'final') =>
  ({ kind: 'single', status, leaderIds }) as const;
const ranking = (ids: [string, number][], status: 'provisional' | 'final' = 'final') =>
  ({
    kind: 'ranking',
    status,
    standings: ids.map(([id, position]) => ({ id, position })),
  }) as const;

describe('preseason scoring', () => {
  it('uses the agreed point values', () => {
    expect(PRESEASON_SCORING).toEqual({ single: 5, rankingExact: 2, rankingNear: 1 });
  });

  it('classifies every V1 question and leaves the four subjective ones unscored', () => {
    expect(Object.keys(PRESEASON_QUESTION_SCORING).sort()).toEqual(
      PREDICTION_QUESTIONS.map((question) => question.id).sort()
    );
    for (const question of PREDICTION_QUESTIONS) {
      const scoring = PRESEASON_QUESTION_SCORING[question.id];
      if (scoring !== 'none') expect(scoring).toBe(question.kind);
    }
    expect(
      Object.entries(PRESEASON_QUESTION_SCORING)
        .filter(([, scoring]) => scoring === 'none')
        .map(([id]) => id)
        .sort()
    ).toEqual(['player-overrated', 'player-underrated', 'team-overrated', 'team-underrated']);
  });

  it('awards single answers when the pick is among tied leaders', () => {
    const outcomes: PreseasonOutcomes = { 'player-total-points': single(['7', '9']) };
    expect(
      scorePreseason({ 'player-total-points': { kind: 'single', id: '9' } }, outcomes).questions[
        'player-total-points'
      ]
    ).toEqual({ scored: true, status: 'final', points: 5 });
    expect(
      scorePreseason({ 'player-total-points': { kind: 'single', id: '8' } }, outcomes).points
    ).toBe(0);
  });

  it('never scores subjective or unknown questions, even with matching outcomes', () => {
    const result = scorePreseason(
      {
        'player-underrated': { kind: 'single', id: '1' },
        'team-overrated': { kind: 'single', id: '2' },
        'retired-question': { kind: 'single', id: '3' },
      },
      {
        'player-underrated': single(['1']),
        'team-overrated': single(['2']),
        'retired-question': single(['3']),
      }
    );
    expect(result.points).toBe(0);
    expect(result.questions['player-underrated']).toMatchObject({ scored: false, points: 0 });
    expect(result.questions['retired-question']).toMatchObject({ scored: false, points: 0 });
  });

  it('scores ranking items exact (2), one place off (1) and further off (0)', () => {
    const outcomes = {
      'team-ranking': ranking([
        ['a', 1],
        ['b', 2],
        ['c', 3],
        ['d', 4],
      ]),
    };
    // a exact, c one off, b one off, d exact
    expect(
      scorePreseason({ 'team-ranking': { kind: 'ranking', ids: ['a', 'c', 'b', 'd'] } }, outcomes)
        .points
    ).toBe(2 + 1 + 1 + 2);
    // d three off, a three off, b and c exact
    expect(
      scorePreseason({ 'team-ranking': { kind: 'ranking', ids: ['d', 'b', 'c', 'a'] } }, outcomes)
        .points
    ).toBe(0 + 2 + 2 + 0);
  });

  it('lets tied ranking items share the range their tie occupies', () => {
    // b and c tie for 2nd, so each occupies positions 2–3.
    const outcomes = {
      'manager-ranking': ranking([
        ['a', 1],
        ['b', 2],
        ['c', 2],
        ['d', 4],
      ]),
    };
    const result = scorePreseason(
      { 'manager-ranking': { kind: 'ranking', ids: ['c', 'a', 'b', 'd'] } },
      outcomes
    );
    // c at 1 is one above its 2–3 range; a at 2 is one off; b at 3 is inside; d exact.
    expect(result.points).toBe(1 + 1 + 2 + 2);
  });

  it('ignores ranking ids missing from the actual standings', () => {
    expect(
      scorePreseason(
        { 'team-ranking': { kind: 'ranking', ids: ['ghost', 'a'] } },
        { 'team-ranking': ranking([['a', 2]]) }
      ).points
    ).toBe(2);
  });

  it('gives no points for pending outcomes or mismatched answer kinds', () => {
    const result = scorePreseason(
      {
        'player-best-round': { kind: 'single', id: '1' },
        'team-ranking': { kind: 'single', id: '1' },
      },
      { 'team-ranking': ranking([['1', 1]]) }
    );
    expect(result.questions['player-best-round']).toEqual({
      scored: true,
      status: 'pending',
      points: 0,
    });
    expect(result.questions['team-ranking'].points).toBe(0);
  });

  it('counts provisional points but stays provisional until every scored question is final', () => {
    const scoredIds = Object.entries(PRESEASON_QUESTION_SCORING)
      .filter(([, scoring]) => scoring !== 'none')
      .map(([id]) => id);
    const allFinal: PreseasonOutcomes = Object.fromEntries(
      scoredIds.map((id) => [
        id,
        PRESEASON_QUESTION_SCORING[id] === 'ranking' ? ranking([['x', 1]]) : single(['x']),
      ])
    );
    const answers = { 'manager-best-round': { kind: 'single', id: 'x' } as const };

    expect(scorePreseason(answers, allFinal)).toMatchObject({ points: 5, provisional: false });

    const provisional = scorePreseason(answers, {
      ...allFinal,
      'manager-best-round': single(['x'], 'provisional'),
    });
    expect(provisional).toMatchObject({ points: 5, provisional: true });

    // A pending scored question (e.g. team-champion before the bracket) keeps the phase provisional.
    const { 'team-champion': _champion, ...withoutChampion } = allFinal;
    expect(scorePreseason(answers, withoutChampion).provisional).toBe(true);
    // Subjective outcomes never affect the provisional flag.
    expect(
      scorePreseason(answers, { ...allFinal, 'player-underrated': single(['x'], 'provisional') })
        .provisional
    ).toBe(false);
  });
});
