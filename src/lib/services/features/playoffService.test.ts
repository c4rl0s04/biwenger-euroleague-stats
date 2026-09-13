import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rows: [] as unknown[][],
  tables: [] as unknown[],
  season: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        mocks.tables.push(table);
        const chain = { innerJoin: () => chain, where: async () => mocks.rows.shift() };
        return chain;
      },
    }),
  },
}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { getPlayoffLeaderboard, SCORING_RULES } from './playoffService';
import { users, playoffPredictions, playoffResults, userPlayoffMedia } from '../../db/schema';

beforeEach(() => {
  mocks.rows = [];
  mocks.tables = [];
  mocks.season.mockReset().mockResolvedValue('fixture-season');
});
it('preserves stage weights, finished denominators, unknown stages and pending outcomes', async () => {
  const stages = ['play-in', 'quarter', 'semi', 'final', 'unknown', 'quarter'];
  mocks.rows = [
    [{ id: '07', name: 'Fixture', icon: null, colorIndex: 0 }],
    stages.map((stage, index) => ({
      userId: '07',
      stage,
      matchId: String(index),
      predictedWinnerId: 1,
    })),
    stages
      .slice(0, 5)
      .map((stage, index) => ({ matchId: String(index), winnerId: 1, isCompleted: true })),
    [{ userId: '07', predictionImageUrl: '/fixture.png' }],
  ];
  const [row] = await getPlayoffLeaderboard();
  expect(SCORING_RULES).toEqual({ 'play-in': 1, quarter: 3, semi: 6, final: 10 });
  expect(row).toMatchObject({
    userId: '07',
    points: 20,
    correctCount: 5,
    totalCount: 5,
    accuracy: 100,
    imageUrl: '/fixture.png',
  });
  expect(row.predictions[5]).toMatchObject({
    isCorrect: null,
    actualWinnerId: undefined,
    resultScore: undefined,
  });
  expect(mocks.season).toHaveBeenCalledOnce();
  expect(mocks.tables).toEqual([users, playoffPredictions, playoffResults, userPlayoffMedia]);
});
it('keeps input user ordering for ties and includes active users without predictions', async () => {
  mocks.rows = [
    [
      { id: 'b', name: 'B' },
      { id: 'a', name: 'A' },
    ],
    [],
    [],
    [],
  ];
  const result = await getPlayoffLeaderboard();
  expect(result.map((row) => row.userId)).toEqual(['b', 'a']);
  expect(
    result.every((row) => row.points === 0 && row.accuracy === 0 && row.predictions.length === 0)
  ).toBe(true);
});
it('does not match numeric prediction identity to string user identity', async () => {
  mocks.rows = [
    [{ id: '7', name: 'Fixture' }],
    [{ userId: 7, matchId: 'QF-1', stage: 'quarter', predictedWinnerId: 1 }],
    [{ matchId: 'QF-1', isCompleted: true, winnerId: 1 }],
    [],
  ];
  expect((await getPlayoffLeaderboard())[0].predictions).toEqual([]);
});
it('preserves null winner equality for completed records and first matching result', async () => {
  mocks.rows = [
    [{ id: '7', name: null }],
    [{ userId: '7', matchId: 'QF-1', stage: 'quarter', predictedWinnerId: null }],
    [
      { matchId: 'QF-1', isCompleted: true, winnerId: null },
      { matchId: 'QF-1', isCompleted: true, winnerId: 2 },
    ],
    [],
  ];
  expect((await getPlayoffLeaderboard())[0]).toMatchObject({
    userName: null,
    points: 3,
    correctCount: 1,
  });
});
it('propagates season failures before querying', async () => {
  const failure = new Error('fixture season failure');
  mocks.season.mockRejectedValue(failure);
  await expect(getPlayoffLeaderboard()).rejects.toBe(failure);
  expect(mocks.tables).toEqual([]);
});
