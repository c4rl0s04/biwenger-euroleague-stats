import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { getPlayerFormMap } from '../server';

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValue({ rows: [] });
});

it('retains team-relative finished-match SQL, bound window/season and uncached reads', async () => {
  expect(await getPlayerFormMap()).toEqual(new Map());
  expect(await getPlayerFormMap(3)).toEqual(new Map());
  expect(fake.season).toHaveBeenCalledTimes(2);
  expect(fake.query.mock.calls.map((call) => call[1])).toEqual([
    [5, 'fixture-season'],
    [3, 'fixture-season'],
  ]);
  const sql = fake.query.mock.calls[0][0];
  expect(sql).toContain("m.status = 'finished'");
  expect(sql).toContain('PARTITION BY t.id ORDER BY m.date DESC');
  expect(sql).toContain('LEFT JOIN player_round_stats');
  expect(sql).toContain('AVG(prs.fantasy_points)');
});

it('preserves DNP penalties, zero/negative scores, rounding, nulls and field allowlisting', async () => {
  fake.query.mockResolvedValue({
    rows: [
      {
        player_id: '7',
        recent_scores: '12,X,0,-2,7',
        avg_recent_points: '4.25',
        secret: 'synthetic-canary',
      },
      { player_id: 8, recent_scores: null, avg_recent_points: null },
      { player_id: 9, recent_scores: '1,1', avg_recent_points: '1' },
    ],
  });
  expect(Array.from((await getPlayerFormMap(3)).values())).toEqual([
    { player_id: 7, recent_scores: '12,X,0,-2,7', avg_recent_points: 4.25, avg_form_score: 5.67 },
    { player_id: 8, recent_scores: '', avg_recent_points: 0, avg_form_score: 0 },
    { player_id: 9, recent_scores: '1,1', avg_recent_points: 1, avg_form_score: 0.67 },
  ]);
});

it.each([0, -1, 1.5, NaN])(
  'does not silently tighten the trusted window contract: %s',
  async (window) => {
    await getPlayerFormMap(window);
    expect(fake.query).toHaveBeenCalledWith(expect.any(String), [window, 'fixture-season']);
  }
);

it('preserves duplicate-ID map order and last-row replacement', async () => {
  fake.query.mockResolvedValue({
    rows: [
      { player_id: 7, recent_scores: '1', avg_recent_points: '1' },
      { player_id: 8, recent_scores: '2', avg_recent_points: '2' },
      { player_id: '7', recent_scores: '3', avg_recent_points: '3' },
    ],
  });
  const map = await getPlayerFormMap();
  expect(Array.from(map.keys())).toEqual([7, 8]);
  expect(map.get(7)?.recent_scores).toBe('3');
});

it('propagates season/query failures without a fallback or retry', async () => {
  const error = new Error('synthetic-failure');
  fake.season.mockRejectedValueOnce(error);
  await expect(getPlayerFormMap()).rejects.toBe(error);
  expect(fake.query).not.toHaveBeenCalled();
  fake.query.mockRejectedValueOnce(error);
  await expect(getPlayerFormMap()).rejects.toBe(error);
  expect(fake.query).toHaveBeenCalledTimes(1);
});
