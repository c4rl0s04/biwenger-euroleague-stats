import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ teams: vi.fn(), leaderboard: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/teams/server', () => ({ getTeamNames: mocks.teams }));
vi.mock('./playoffs.service', () => ({ getPlayoffLeaderboard: mocks.leaderboard }));
import { getPlayoffOverview, getPlayoffDetail } from './playoff-screen.service';
beforeEach(() => vi.resetAllMocks());
it('does not fetch desktop teams on the phone path', async () => {
  mocks.leaderboard.mockResolvedValue([]);
  expect(await getPlayoffOverview(Promise.resolve(true))).toEqual({
    presentation: 'phone',
    leaderboard: [],
  });
  expect(mocks.teams).not.toHaveBeenCalled();
});
it('gets teams only after leaderboard succeeds on desktop', async () => {
  mocks.leaderboard.mockResolvedValue([]);
  mocks.teams.mockResolvedValue([{ id: 1, name: null }]);
  expect(await getPlayoffOverview(Promise.resolve(false))).toEqual({
    presentation: 'desktop',
    leaderboard: [],
    teams: [{ id: 1, name: null }],
  });
  const failure = new Error('read failed');
  mocks.leaderboard.mockRejectedValue(failure);
  mocks.teams.mockClear();
  await expect(getPlayoffOverview(Promise.resolve(false))).rejects.toBe(failure);
  expect(mocks.teams).not.toHaveBeenCalled();
});
it('preserves textual identity, null missing user and stored-point detail projection', async () => {
  const user = {
    userId: '07',
    predictions: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      points: i === 0 ? null : 1000,
    })),
  };
  mocks.leaderboard.mockResolvedValue([user]);
  expect(await getPlayoffDetail('7')).toBeNull();
  const result = await getPlayoffDetail('07');
  expect(result?.rows).toHaveLength(20);
  expect(result?.rows[0]).toEqual({ key: '1', title: 'Registro 1' });
  expect(result?.rows[1]).toEqual({
    key: '2',
    title: 'Registro 2',
    value: (1000).toLocaleString('es-ES'),
  });
});
