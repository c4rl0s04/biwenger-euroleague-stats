import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import {
  resolveAllPlayAllSeason,
  listAllPlayAllRounds,
  listAllPlayAllUsers,
  listAllPlayAllScores,
} from './all-play-all.query';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.query.mockResolvedValue({ rows: [] });
});
it('delegates current season without changing default arguments or errors', async () => {
  mocks.season.mockResolvedValue('synthetic');
  expect(await resolveAllPlayAllSeason()).toBe('synthetic');
  expect(mocks.season).toHaveBeenCalledWith();
  const failure = new Error('unknown season');
  mocks.season.mockRejectedValue(failure);
  await expect(resolveAllPlayAllSeason()).rejects.toBe(failure);
});
it('preserves round/score SQL and parameter order, including null round ID', async () => {
  await listAllPlayAllRounds('synthetic');
  await listAllPlayAllScores(null, 'synthetic');
  expect(mocks.query.mock.calls).toEqual([
    [
      'SELECT DISTINCT round_id FROM user_rounds WHERE season_id = $1 AND participated = TRUE',
      ['synthetic'],
    ],
    [
      'SELECT user_id, points FROM user_rounds WHERE season_id = $2 AND round_id = $1 AND participated = TRUE',
      [null, 'synthetic'],
    ],
  ]);
});
it('preserves active participants, display fallback and absence of additional ordering', async () => {
  await listAllPlayAllUsers('synthetic');
  const [sql, params] = mocks.query.mock.calls[0];
  expect(sql.replace(/\s+/g, ' ').trim()).toBe(
    "SELECT u.id, COALESCE(us.name, u.name) as name, COALESCE(us.icon, u.icon) as icon, COALESCE(us.color_index, u.color_index, 0) as color_index FROM user_seasons us JOIN users u ON u.id = us.user_id WHERE us.season_id = $1 AND COALESCE(us.status, 'active') = 'active'"
  );
  expect(params).toEqual(['synthetic']);
});
