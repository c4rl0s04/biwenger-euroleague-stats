import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({
  db: { query: dependencies.query },
  pool: { query: dependencies.query },
  pgClient: { query: dependencies.query },
}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: dependencies.season }));

import { getMarketTrendsAnalysis, MARKET_TRENDS_POLICY } from '@/features/market/server';
import { mapMarketTrend } from './mappers/market-trends.mapper';
import { parseMarketTrendDays } from '../validation/market-trends';
import { GET } from '@/app/api/market/trends/route';

const raw = {
  date: '2026-01-02',
  volume: '10.99',
  avg_price: '3.75',
  ops_count: '2',
  transfers: [
    { player_name: null, price: null },
    { player_name: 'Fixture Player', price: 10 },
  ],
};
const expected = { ...raw, volume: 10, avg_price: 3, ops_count: 2 };

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
  dependencies.query.mockResolvedValue({ rows: [raw] });
});

it('allowlists both top-level and nested fields, retaining numeric truncation and nulls', () => {
  const record = {
    ...raw,
    internal_field: 'not exposed',
    transfers: [{ player_name: null, price: null, internal_field: 'not exposed' }],
  };
  expect(mapMarketTrend(record)).toEqual({
    ...expected,
    transfers: [{ player_name: null, price: null }],
  });
  expect(record.transfers[0]).toHaveProperty('internal_field');
  expect(mapMarketTrend({ ...raw, transfers: null }).transfers).toEqual([]);
});

it('preserves null JSON aggregates instead of introducing zero-valued statistics', () => {
  const model = mapMarketTrend({ ...raw, volume: null, avg_price: null });
  expect(model.volume).toBeNaN();
  expect(JSON.parse(JSON.stringify(model))).toEqual({ ...expected, volume: null, avg_price: null });
});

it('uses one season-scoped query per call, preserves defaults and supports internal 14-day reads', async () => {
  expect(await getMarketTrendsAnalysis()).toEqual([expected]);
  expect(await getMarketTrendsAnalysis(14)).toEqual([expected]);
  expect(dependencies.query.mock.calls).toEqual([
    [expect.stringContaining("interval '30 days'"), ['fixture-season']],
    [expect.stringContaining("interval '14 days'"), ['fixture-season']],
  ]);
  expect(dependencies.season).toHaveBeenCalledTimes(2);
  expect(MARKET_TRENDS_POLICY).toMatchObject({
    identity: 'none',
    serverCache: 'none',
    httpMaxAgeSeconds: 60,
  });
});

it('returns empty data and propagates failures without fabricating partial results', async () => {
  dependencies.query
    .mockResolvedValueOnce({ rows: [] })
    .mockRejectedValueOnce(new Error('fixture read failure'));
  expect(await getMarketTrendsAnalysis()).toEqual([]);
  await expect(getMarketTrendsAnalysis()).rejects.toThrow('fixture read failure');
});

it.each([
  [null, 30],
  ['', 30],
  ['7abc', 7],
  ['30.9', 30],
  ['90', 90],
  ['180', 180],
  ['365.9', 365],
] as const)('preserves valid HTTP input %s', (input, value) => {
  expect(parseMarketTrendDays(input)).toEqual({ valid: true, value });
});

it.each([
  ['abc', 'Invalid numeric value'],
  ['0', 'Value must be at least 1'],
  ['366', 'Value must be at most 365'],
  ['14', 'Invalid days parameter'],
  ['31', 'Invalid days parameter'],
])('preserves HTTP rejection for %s', (input, error) => {
  expect(parseMarketTrendDays(input)).toEqual({ valid: false, error });
});

it.each([undefined, 'fixture-session'])(
  'returns the same public statistical contract with cookie %s',
  async (cookie) => {
    const response = await GET(
      new NextRequest('https://fixture.invalid/api/market/trends?days=7abc&userId=ignored', {
        headers: cookie ? { cookie: `fixture=${cookie}` } : {},
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=60, stale-while-revalidate=60'
    );
    expect(await response.json()).toEqual({ success: true, data: [expected] });
    expect(dependencies.query).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("interval '7 days'"),
      ['fixture-season']
    );
  }
);

it('rejects unsupported HTTP days before season or query reads', async () => {
  const response = await GET(new NextRequest('https://fixture.invalid/api/market/trends?days=14'));
  expect(response.status).toBe(400);
  expect(response.headers.get('cache-control')).toBe(
    'private, no-store, max-age=0, must-revalidate'
  );
  expect(await response.json()).toEqual({ success: false, error: 'Invalid days parameter' });
  expect(dependencies.season).not.toHaveBeenCalled();
  expect(dependencies.query).not.toHaveBeenCalled();
});
