import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/managers/server', () => ({
  getManagerDirectory: vi.fn(() => {
    throw new Error('This isolated Market read must not request the manager directory');
  }),
}));
const fake = vi.hoisted(() => ({ query: vi.fn(), form: vi.fn(), season: vi.fn() }));
vi.mock('../../index', () => ({ db: {}, pgClient: { query: fake.query } }));
vi.mock('@/lib/db/client', () => ({
  db: { query: fake.query },
  pgClient: { query: fake.query },
}));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: fake.season }));
vi.mock('@/features/players/server', () => ({
  getPlayerFormStats: async (...args: number[]) => {
    const map = await fake.form(...args);
    return Array.from(
      map.entries(),
      ([playerId, row]: [
        number,
        { recent_scores: string; avg_recent_points: number; avg_form_score: number },
      ]) => ({
        playerId,
        recentScores: row.recent_scores,
        averageRecentPoints: row.avg_recent_points,
        formScore: row.avg_form_score,
      })
    );
  },
}));
import { getMarketOpportunities } from './market';

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.form.mockResolvedValue(new Map());
  fake.query.mockResolvedValue({ rows: [] });
});

it('uses three-round penalized form, value/trend ordering and the requested slice', async () => {
  const rows = [1, 2, 3, 4].map((id) => ({
    player_id: id,
    name: `Player ${id}`,
    position: null,
    team_id: null,
    team: null,
    price: 1000000,
    price_trend: id === 2 ? 20 : 10,
  }));
  fake.query.mockResolvedValue({ rows });
  fake.form.mockResolvedValue(
    new Map(
      [1, 2, 3, 4].map((id) => [
        id,
        {
          recent_scores: '30,X,30',
          avg_recent_points: 30,
          avg_form_score: 20,
        },
      ])
    )
  );
  expect(await getMarketOpportunities()).toEqual(
    [2, 1, 3].map((id) => ({
      ...rows[id - 1],
      avg_recent_points: 20,
      recent_scores: '30,X,30',
      value_score: 20,
    }))
  );
  expect(fake.form).toHaveBeenCalledWith(3);
  expect(fake.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 100'), ['fixture-season']);
  expect(await getMarketOpportunities(0)).toEqual([]);
});

it('preserves missing-form fallback and propagates read errors without caching', async () => {
  fake.query.mockResolvedValue({ rows: [{ player_id: 7, price: 100, price_trend: 0 }] });
  expect((await getMarketOpportunities(8))[0]).toMatchObject({
    avg_recent_points: 0,
    recent_scores: '',
    value_score: 0,
  });
  fake.form.mockRejectedValue(new Error('fixture form failure'));
  await expect(getMarketOpportunities()).rejects.toThrow('fixture form failure');
  expect(fake.query).toHaveBeenCalledTimes(2);
});
