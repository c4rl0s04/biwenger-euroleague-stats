import { expect, it } from 'vitest';
import { mapPlayoffLeaderboard } from './playoffs.mapper';
import type { PlayoffFacts } from '../queries/playoff.records';

it('allowlists nested records and serializes timestamps without changing score fields', () => {
  const prediction = {
    id: 1,
    seasonId: 'fixture',
    userId: '07',
    stage: 'quarter',
    matchId: 'QF-1',
    predictedWinnerId: 3,
    predictionDetails: null,
    points: 99,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    unexpectedField: 'not-for-presentation',
  };
  const facts: PlayoffFacts = {
    allUsers: [{ id: '07', name: null, icon: null, colorIndex: 0 }],
    predictions: [prediction],
    results: [{ matchId: 'QF-1', winnerId: 3, score: null, isCompleted: true }],
    media: [],
  };
  const [row] = mapPlayoffLeaderboard(facts);
  expect(row.points).toBe(3);
  expect(row.predictions[0]).toEqual({
    id: 1,
    seasonId: 'fixture',
    userId: '07',
    stage: 'quarter',
    matchId: 'QF-1',
    predictedWinnerId: 3,
    predictionDetails: null,
    points: 99,
    createdAt: '2025-01-01T00:00:00.000Z',
    isCorrect: true,
    actualWinnerId: 3,
    resultScore: null,
  });
  expect(JSON.stringify(row)).not.toContain('not-for-presentation');
});
