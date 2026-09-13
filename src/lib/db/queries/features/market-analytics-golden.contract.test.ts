import { beforeEach, expect, it, vi } from 'vitest';
import fixtures from '@/features/market/server/fixtures/analytics-original.json';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('../../index', () => ({ db: {}, pgClient: { query: fake.query } }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import * as legacy from './market';
const reads = legacy as unknown as Record<string, (...args: number[]) => Promise<unknown>>;

it.each(fixtures)('$name excludes extra record fields and keeps empty results', async (fixture) => {
  fake.query.mockResolvedValueOnce({
    rows: fixture.rows.map((row) => ({ ...row, credential: 'synthetic-canary' })),
  });
  expect(JSON.parse(JSON.stringify(await reads[fixture.name](...fixture.args)))).toEqual(
    fixture.expected
  );
  fake.query.mockResolvedValueOnce({ rows: [] });
  expect(await reads[fixture.name](...fixture.args)).toEqual([]);
});

it.each(fixtures)('$name preserves query errors and does not add caching', async (fixture) => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    fake.query.mockRejectedValue(new Error('fixture-query-error'));
    if (fixture.name === 'getRecordBid') {
      expect(await reads[fixture.name](...fixture.args)).toEqual([]);
      expect(warning).toHaveBeenCalledWith('Could not fetch record bid:', 'fixture-query-error');
    } else {
      await expect(reads[fixture.name](...fixture.args)).rejects.toThrow('fixture-query-error');
      expect(warning).not.toHaveBeenCalled();
    }
    fake.season.mockRejectedValue(new Error('fixture-season-error'));
    await expect(reads[fixture.name](...fixture.args)).rejects.toThrow('fixture-season-error');
    expect(fake.query).toHaveBeenCalledTimes(1);
  } finally {
    warning.mockRestore();
  }
});

it('preserves KPI integer truncation, fractional average bids and missing-row failure', async () => {
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValueOnce({
    rows: [{ total_volume: '12.9', total_ops: '3', avg_price: null, avg_bids: '1.75' }],
  });
  expect(await legacy.getMarketOverviewKPIs()).toEqual({
    totalVolume: 12,
    totalOps: 3,
    avgPrice: 0,
    avgBids: 1.75,
  });
  fake.query.mockResolvedValueOnce({ rows: [] });
  await expect(legacy.getMarketOverviewKPIs()).rejects.toThrow();
});

it('preserves position ordering, nullable position and the empty shape', async () => {
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValueOnce({
    rows: [{ position: null, count: '3', avg_price: '12.9', total_volume: '38.7' }],
  });
  expect(await legacy.getPositionAnalysis()).toEqual({
    mostSigned: { position: null, count: 3 },
    distribution: [{ position: null, count: 3, avg_price: 12, total_volume: 38 }],
  });
  fake.query.mockResolvedValueOnce({ rows: [] });
  expect(await legacy.getPositionAnalysis()).toEqual({ mostSigned: null, distribution: [] });
});

it('preserves duel matrix symmetry, tied leaders and unknown participant filtering', async () => {
  fake.season.mockResolvedValue('fixture-season');
  const users = [
    { id: '7', name: 'A', icon: null, color_index: '0' },
    { id: '8', name: 'B', icon: null, color_index: null },
  ];
  const duel = {
    winner_id: '7',
    winner_name: 'A',
    winner_icon: null,
    winner_color_index: '0',
    runner_id: '8',
    runner_name: 'B',
    runner_icon: null,
    runner_color_index: null,
    margin: '10.9',
  };
  fake.query.mockResolvedValueOnce({ rows: users }).mockResolvedValueOnce({
    rows: [
      duel,
      {
        ...duel,
        winner_id: '8',
        winner_name: 'B',
        runner_id: '7',
        runner_name: 'A',
        margin: '20',
      },
      { ...duel, runner_id: '999' },
    ],
  });
  const result = await legacy.getBiddingDuelsStats();
  expect(result.users).toEqual([
    { id: 7, name: 'A', icon: null, color_index: 0 },
    { id: 8, name: 'B', icon: null, color_index: null },
  ]);
  expect(result.matrix).toEqual({
    7: { 8: { wins: 1, losses: 1, duels: 2, total_margin: 30, avg_margin: 15 } },
    8: { 7: { wins: 1, losses: 1, duels: 2, total_margin: 30, avg_margin: 15 } },
  });
  expect(result.hottestRivalry).toMatchObject({
    user1_id: 7,
    user2_id: 8,
    wins1: 1,
    wins2: 1,
    leader_id: null,
    trailer_id: null,
    duels: 2,
  });
  expect(result.biggestDominance).toEqual(result.hottestRivalry);
  expect(fake.query).toHaveBeenCalledTimes(2);
  expect(fake.season).toHaveBeenCalledTimes(1);
});

it('keeps empty duel projections', async () => {
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValue({ rows: [] });
  expect(await legacy.getBiddingDuelsStats()).toEqual({
    users: [],
    matrix: {},
    hottestRivalry: null,
    biggestDominance: null,
  });
});

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
});

// Frozen by executing the unmodified feeca992 functions on synthetic SQL-shaped rows.
it.each(fixtures)(
  '$name preserves original fields, numeric conversion and null JSON semantics',
  async (fixture) => {
    fake.query.mockResolvedValue({ rows: fixture.rows });
    expect(JSON.parse(JSON.stringify(await reads[fixture.name](...fixture.args)))).toEqual(
      fixture.expected
    );
    expect(fake.query).toHaveBeenCalledExactlyOnceWith(expect.any(String), fixture.queryArgs);
    expect(fake.season).toHaveBeenCalledTimes(1);
  }
);
