import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pgClient: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { getPlayerFormMap } from './player-form';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.season.mockResolvedValue('fixture-season');
});
it('binds window and season, uses only finished games and preserves unknown/DNP/zero scores', async () => {
  mocks.query.mockResolvedValue({ rows: [{ player_id: '7', recent_scores: '10,X,?,0' }] });
  const result = await getPlayerFormMap(4);
  expect(result.get(7)).toEqual({
    player_id: 7,
    recent_scores: '10,X,?,0',
    avg_recent_points: 5,
    avg_form_score: 3.33,
  });
  const [sql, bindings] = mocks.query.mock.calls[0];
  expect(bindings).toEqual([4, 'fixture-season']);
  expect(sql).toContain("m.status = 'finished'");
  expect(sql).toContain('prs.season_id = $2');
  expect(sql).toContain('ps.season_id = $2');
  expect(sql).toContain('ORDER BY rmi.match_date DESC');
});
it('returns an empty map and resolves the season for every uncached call', async () => {
  mocks.query.mockResolvedValue({ rows: [] });
  expect(await getPlayerFormMap()).toEqual(new Map());
  await getPlayerFormMap();
  expect(mocks.season).toHaveBeenCalledTimes(2);
});
it('propagates database failures', async () => {
  const failure = new Error('fixture');
  mocks.query.mockRejectedValue(failure);
  await expect(getPlayerFormMap()).rejects.toBe(failure);
});
