import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/all-play-all.query', () => ({
  resolveAllPlayAllSeason: vi.fn(),
  listAllPlayAllRounds: vi.fn(),
  listAllPlayAllUsers: vi.fn(),
  listAllPlayAllScores: vi.fn(),
}));
import { cached, clearCache } from '@/lib/utils/cache';
import { createAllPlayAllService, ALL_PLAY_ALL_POLICY } from './all-play-all.service';
import type { AllPlayAllDependencies } from './all-play-all.service';

const dependencies = {
  resolveSeason: vi.fn(),
  rounds: vi.fn(),
  users: vi.fn(),
  scores: vi.fn(),
  cache: vi.fn<AllPlayAllDependencies['cache']>(cached),
};
const service = createAllPlayAllService(dependencies);
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  clearCache();
  vi.clearAllMocks();
  dependencies.resolveSeason.mockResolvedValue('synthetic-season');
  dependencies.rounds.mockResolvedValue([{ round_id: 2 }, { round_id: null }]);
  dependencies.users.mockResolvedValue([{ id: '1', name: null, icon: null, color_index: 0 }]);
  dependencies.scores.mockResolvedValue([]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('retains season resolution outside cache and sequential query order on miss', async () => {
  const first = await service();
  expect(first[0].pct).toBeNull();
  expect(dependencies.cache).toHaveBeenCalledWith(
    'advanced:all-play-all:synthetic-season',
    900,
    expect.any(Function)
  );
  expect(dependencies.scores.mock.calls).toEqual([
    [2, 'synthetic-season'],
    [null, 'synthetic-season'],
  ]);
  expect(dependencies.rounds.mock.invocationCallOrder[0]).toBeLessThan(
    dependencies.users.mock.invocationCallOrder[0]
  );
  expect(dependencies.users.mock.invocationCallOrder[0]).toBeLessThan(
    dependencies.scores.mock.invocationCallOrder[0]
  );
  expect(await service()).toEqual(first);
  expect(dependencies.resolveSeason).toHaveBeenCalledTimes(2);
  expect(dependencies.rounds).toHaveBeenCalledTimes(1);
  expect(ALL_PLAY_ALL_POLICY).toMatchObject({
    access: 'public-league-statistics',
    identity: 'none',
    httpCacheHeader: 'unchanged-unset',
  });
});
it('supports existing raw NaN cache payloads, expiry and season isolation', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  await cached('advanced:all-play-all:synthetic-season', 900, async () => [
    {
      user_id: 'old',
      name: null,
      icon: null,
      color_index: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      pct: NaN,
    },
  ]);
  expect((await service())[0]).toMatchObject({ user_id: 'old', pct: null });
  expect(dependencies.rounds).not.toHaveBeenCalled();
  vi.advanceTimersByTime(900000);
  expect((await service())[0].user_id).toBe('1');
  dependencies.resolveSeason.mockResolvedValue('other-season');
  await service();
  expect(dependencies.rounds.mock.calls).toEqual([['synthetic-season'], ['other-season']]);
});
it('propagates season failures without caching or swallowing them', async () => {
  const failure = new Error('synthetic season failure');
  dependencies.resolveSeason.mockRejectedValueOnce(failure);
  await expect(service()).rejects.toBe(failure);
  expect(dependencies.cache).not.toHaveBeenCalled();
});
it.each(['rounds', 'users', 'scores'] as const)(
  'caches empty fallback on %s failure',
  async (method) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    dependencies[method].mockRejectedValueOnce(new Error('synthetic query failure'));
    expect(await service()).toEqual([]);
    expect(await service()).toEqual([]);
    expect(dependencies[method]).toHaveBeenCalledTimes(1);
  }
);
