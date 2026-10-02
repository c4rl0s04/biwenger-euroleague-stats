import { expect, it } from 'vitest';
import { PREDICTION_QUESTIONS, QUESTION_SET_VERSION } from './questions';
import { validateCurrentAnswers } from './submission';

const options = {
  players: [{ id: 'p1', name: 'Player', image: null }],
  teams: [
    { id: 't1', name: 'Team 1', image: null },
    { id: 't2', name: 'Team 2', image: null },
  ],
  managers: [
    { id: 'm1', name: 'Manager 1', image: null },
    { id: 'm2', name: 'Manager 2', image: null },
  ],
};

it('keeps all 12 questions in stable player, team, manager order', () => {
  expect(QUESTION_SET_VERSION).toBe('season-predictions-v1');
  expect(PREDICTION_QUESTIONS.map((question) => question.id)).toEqual([
    'player-total-points',
    'player-round-leader',
    'player-best-round',
    'player-underrated',
    'player-overrated',
    'team-ranking',
    'team-champion',
    'team-underrated',
    'team-overrated',
    'manager-ranking',
    'manager-round-wins',
    'manager-best-round',
  ]);
  expect(PREDICTION_QUESTIONS.map((question) => question.order)).toEqual(
    Array.from({ length: 12 }, (_, index) => index + 1)
  );
});

it('accepts partial and complete ranking answers, including clearing to empty', () => {
  expect(validateCurrentAnswers({}, options)).toEqual({});
  expect(
    validateCurrentAnswers(
      {
        'player-total-points': { kind: 'single', id: 'p1' },
        'team-ranking': { kind: 'ranking', ids: ['t2', 't1'] },
        'manager-ranking': { kind: 'ranking', ids: ['m1', 'm2'] },
      },
      options
    )
  ).toEqual({
    'player-total-points': { kind: 'single', id: 'p1' },
    'team-ranking': { kind: 'ranking', ids: ['t2', 't1'] },
    'manager-ranking': { kind: 'ranking', ids: ['m1', 'm2'] },
  });
});

it('rejects non-permutations, unknown IDs and mismatched answer types', () => {
  for (const answer of [
    { kind: 'ranking', ids: ['t1'] },
    { kind: 'ranking', ids: ['t1', 't1'] },
    { kind: 'ranking', ids: ['t1', 'wrong'] },
    { kind: 'single', id: 't1' },
  ])
    expect(() => validateCurrentAnswers({ 'team-ranking': answer }, options)).toThrow();
  expect(() =>
    validateCurrentAnswers({ 'team-champion': { kind: 'single', id: 'p1' } }, options)
  ).toThrow();
  expect(() =>
    validateCurrentAnswers({ 'not-a-question': { kind: 'single', id: 'p1' } }, options)
  ).toThrow();
});
