import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createCompareService, COMPARE_READ_POLICY } from './compare.service';
import { mapSquadSummary, mapComparePredictions } from '../mappers/compare.mapper';
import { mapCompareOpponent } from './opponent.service';
import { findCompareManager, selectDesktopManager } from '../../validation/selection';
import type { CompareAdvancedStats, CompareDataLiteResponse } from '../../models/compare';
import type { PorrasStats } from '@/features/predictions/public';

const users = [
  { id: '1', name: 'One', icon: null, color_index: 0 },
  { id: '2', name: 'Two', icon: null, color_index: 1 },
];
const predictions: PorrasStats = {
  achievements: { perfect_10: [], blanked: [] },
  participation: [],
  table_stats: [],
  performance: [],
  history: { users: [], jornadas: [] },
  clutch_stats: [],
  porra_stats: { victorias: [], predictable_teams: [], promedios: [], mejor_jornada: [] },
};
const captain = {
  total_rounds: 0,
  extra_points: 0,
  avg_points: 0,
  most_used: [],
  best_round: { name: '', points: 0 },
  worst_round: { name: '', points: 0 },
};
const homeAway = { total_home: 0, total_away: 0, avg_home: 0, avg_away: 0, difference_pct: 0 };
const advanced: CompareAdvancedStats = {
  streaks: [],
  heatCheck: [],
  hunter: [],
  bottler: [],
  heartbreaker: [],
  noGlory: [],
  jinx: [],
  floorCeiling: [],
  volatility: [],
  efficiency: [],
  dominance: [],
  reliability: [],
  theoreticalGap: [],
  rivalryMatrix: {},
  leagueComparison: [],
  market: [],
  bestSeller: [],
  biddingDuels: { matrix: {}, summaries: [] },
  theThief: [],
};
function dependencies() {
  return {
    users: vi.fn(async () => users),
    standings: vi.fn(async () => []),
    predictions: vi.fn(async () => predictions),
    history: vi.fn(async (_id: string | number) => []),
    captain: vi.fn(async (_id: string | number) => captain),
    homeAway: vi.fn(async (_id: string | number) => homeAway),
    squad: vi.fn(async (_id: string | number) => []),
    advanced: vi.fn(async () => advanced),
  };
}
describe('Compare orchestration', () => {
  it('shares the core response but never runs advanced reads for lite', async () => {
    const deps = dependencies();
    const service = createCompareService(deps);
    const lite = await service.getCompareDataLite();
    expect(deps.advanced).not.toHaveBeenCalled();
    expect(lite).not.toHaveProperty('advancedStats');
    const full = await service.getCompareData();
    const { advancedStats, ...core } = full;
    expect(core).toEqual(lite);
    expect(advancedStats).toEqual(advanced);
    expect(deps.users).toHaveBeenCalledTimes(2);
    expect(deps.history.mock.calls).toEqual([['1'], ['2'], ['1'], ['2']]);
    expect(JSON.parse(JSON.stringify(full))).toEqual(full);
  });
  it('does not memoize calls or use selected/session identity', async () => {
    const deps = dependencies();
    const service = createCompareService(deps);
    await service.getCompareDataLite();
    await service.getCompareDataLite();
    expect(deps.squad.mock.calls).toEqual([['1'], ['2'], ['1'], ['2']]);
    expect(COMPARE_READ_POLICY.httpCache).toBe('public, max-age=300, stale-while-revalidate=60');
  });
  it('preserves empty-directory output without per-manager reads', async () => {
    const deps = dependencies();
    deps.users.mockResolvedValue([]);
    const data = await createCompareService(deps).getCompareDataLite();
    expect(data.users).toEqual([]);
    expect(data.history).toEqual([]);
    expect(deps.history).not.toHaveBeenCalled();
  });
  it.each([
    'users',
    'standings',
    'predictions',
    'history',
    'captain',
    'homeAway',
    'squad',
    'advanced',
  ] as const)('propagates %s failures', async (name) => {
    const deps = dependencies();
    const error = new Error('fixture failure');
    deps[name].mockRejectedValue(error);
    await expect(createCompareService(deps).getCompareData()).rejects.toBe(error);
  });
});
describe('Compatibility projections and selection', () => {
  it('counts only positive squad points but takes the first ordered player as best', () => {
    const player = {
      id: 1,
      name: null,
      position: null,
      team: null,
      price: 0,
      points: -1,
      average: 0,
      status: null,
    };
    expect(
      mapSquadSummary([
        player,
        { ...player, points: 10 },
        { ...player, points: 20 },
        { ...player, points: 0 },
      ])
    ).toEqual({ avgPlayerPoints: 15, bestPlayer: { name: null, points: -1 } });
    expect(mapSquadSummary([])).toEqual({
      avgPlayerPoints: 0,
      bestPlayer: { name: '-', points: 0 },
    });
    expect(mapComparePredictions(null)).toEqual({
      achievements: {},
      clutch: [],
      victorias: [],
      promedios: [],
      participation: [],
    });
  });
  it('retains strict desktop equality versus string-based phone matching', () => {
    expect(selectDesktopManager(users, 2)).toBe(users[0]);
    expect(selectDesktopManager(users, '2')).toBe(users[1]);
    expect(findCompareManager(users, 2)).toBe(users[1]);
    expect(findCompareManager(users, '2abc')).toBeUndefined();
    expect(findCompareManager(users, '02')).toBeUndefined();
    expect(selectDesktopManager([], '1')).toBeUndefined();
  });
  it('keeps nullish session fallback, self-selection and blank unknown-manager states', () => {
    const data: CompareDataLiteResponse = {
      users,
      history: [],
      standings: [],
      porras: [],
      predictions: mapComparePredictions(null),
    };
    expect(mapCompareOpponent(data, '2', null)?.current).toBe(users[0]);
    expect(mapCompareOpponent(data, '2', '2')?.current).toBe(users[1]);
    expect(mapCompareOpponent(data, '2', '')).toBeNull();
    expect(mapCompareOpponent(data, '2', 'missing')).toBeNull();
    expect(mapCompareOpponent(data, '2abc', '1')).toBeNull();
    expect(mapCompareOpponent(data, '02', '1')).toBeNull();
  });
});
