import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/base-standings.query', () => ({
  queryFullStandings: vi.fn(),
  querySimpleStandings: vi.fn(),
  queryValueRanking: vi.fn(),
  queryLeagueOverview: vi.fn(),
}));
import {
  createBaseStandingsService,
  STANDINGS_ACCESS_POLICY,
  STANDINGS_CACHE_POLICY,
} from './base-standings.service';

const dependencies = { full: vi.fn(), simple: vi.fn(), values: vi.fn(), overview: vi.fn() };
const service = createBaseStandingsService(dependencies);
beforeEach(() => vi.resetAllMocks());

it('keeps public identity-free reads and uncached service freshness explicit', async () => {
  expect(STANDINGS_ACCESS_POLICY).toEqual({
    read: 'public-league-statistics',
    identity: 'none',
    mutations: 'none',
  });
  expect(STANDINGS_CACHE_POLICY).toEqual({
    server: 'uncached',
    fullHttpSeconds: 60,
    overviewHttpSeconds: 900,
    valueHttpSeconds: 900,
    staleSeconds: 60,
  });
  dependencies.full.mockResolvedValue([]);
  expect(await service.getFullStandings()).toEqual([]);
  expect(await service.getFullStandings({ sortBy: 'unknown', direction: 'asc' })).toEqual([]);
  expect(dependencies.full.mock.calls).toEqual([[{}], [{ sortBy: 'unknown', direction: 'asc' }]]);
});
it('maps rows without reordering tied rankings or coercing string values', async () => {
  const first = {
    user_id: '2',
    name: null,
    icon: null,
    color_index: 0,
    total_points: 4,
    team_value: '0010',
    price_trend: -1,
    position: 1,
  };
  const second = { ...first, user_id: '1' };
  dependencies.simple.mockResolvedValue([{ ...first, privateField: 'excluded' }, second]);
  expect(await service.getSimpleStandings()).toEqual([first, second]);
  dependencies.simple.mockResolvedValue([]);
  expect(await service.getSimpleStandings()).toEqual([]);
  expect(dependencies.simple).toHaveBeenCalledTimes(2);
});
it.each(['full', 'simple', 'values', 'overview'] as const)(
  'propagates %s errors unchanged',
  async (method) => {
    const error = new Error('synthetic read failure');
    dependencies[method].mockRejectedValue(error);
    const calls = {
      full: service.getFullStandings,
      simple: service.getSimpleStandings,
      values: service.fetchValueRanking,
      overview: service.getLeagueOverview,
    };
    await expect(calls[method]()).rejects.toBe(error);
  }
);
