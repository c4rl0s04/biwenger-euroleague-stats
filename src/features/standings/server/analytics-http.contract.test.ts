import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PgDialect } from 'drizzle-orm/pg-core';
import { GET as progression } from '@/app/api/standings/points-progression/route';
import { GET as winners } from '@/app/api/standings/round-winners/route';
import { GET as advanced } from '@/app/api/standings/advanced/route';
import { clearCache, getCacheStats } from '@/lib/utils/cache';
import { GET as route0 } from '@/app/api/standings/bottlers/route';
import { GET as route1 } from '@/app/api/standings/efficiency/route';
import { GET as route2 } from '@/app/api/standings/heartbreakers/route';
import { GET as route3 } from '@/app/api/standings/jinx/route';
import { GET as route4 } from '@/app/api/standings/league-comparison/route';
import { GET as route5 } from '@/app/api/standings/no-glory/route';
import { GET as route6 } from '@/app/api/standings/placements/route';
import { GET as route7 } from '@/app/api/standings/streaks/route';
import { GET as route8 } from '@/app/api/standings/volatility/route';
import { GET as route9 } from '@/app/api/standings/captains/route';
import { GET as route10 } from '@/app/api/standings/theoretical/route';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({
  pgClient: { query: mocks.query },
  db: { execute: mocks.execute },
}));
vi.mock('@/lib/db/client', () => ({ db: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
vi.mock('@/features/rounds/server', () => ({ getUserPerformanceHistoryService: async () => [] }));
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  clearCache();
  mocks.query.mockReset().mockResolvedValue({ rows: [] });
  mocks.execute.mockReset().mockResolvedValue({ rows: [] });
  mocks.season.mockReset().mockResolvedValue(1);
});
afterEach(() => {
  vi.restoreAllMocks();
});
it.each([
  ['', 10, 15],
  ['?limit=0', 10, 0],
  ['?limit=-3', -3, -3],
  ['?limit=7abc', 7, 7],
  ['?limit=bad', 10, NaN],
  ['?limit=', 10, 15],
  ['?limit=2&limit=9', 2, 2],
] as const)(
  'progression/winners preserve SQL-bound limit semantics for %s',
  async (query, pLimit, wLimit) => {
    const row = {
      user_id: '007',
      name: null,
      icon: '',
      color_index: 0,
      round_id: 4,
      round_name: null,
      points: null,
      cumulative_points: null,
    };
    mocks.execute.mockResolvedValue({ rows: [{ ...row, unrelated: 'synthetic' }] });
    const p = await progression(
      new NextRequest('http://localhost/api/standings/points-progression' + query)
    );
    expect(await p.json()).toEqual({
      success: true,
      data: [
        {
          user_id: '007',
          name: null,
          color_index: 0,
          round_id: 4,
          round_name: null,
          points: null,
          cumulative_points: null,
        },
      ],
    });
    expect(p.headers.get('Cache-Control')).toBe('public, max-age=60, stale-while-revalidate=60');
    const dialect = new PgDialect();
    expect(dialect.sqlToQuery(mocks.execute.mock.calls[0][0]).params).toContain(pLimit);
    mocks.execute.mockClear();
    const w = await winners(
      new NextRequest('http://localhost/api/standings/round-winners' + query)
    );
    expect(await w.json()).toEqual({
      success: true,
      data: [
        {
          user_id: '007',
          name: null,
          icon: '',
          color_index: 0,
          round_id: 4,
          round_name: null,
          points: null,
        },
      ],
    });
    expect(w.headers.get('Cache-Control')).toBe('public, max-age=900, stale-while-revalidate=60');
    expect(
      dialect
        .sqlToQuery(mocks.execute.mock.calls[0][0])
        .params.some((value) => Object.is(value, wLimit))
    ).toBe(true);
  }
);
const routes = [
  ['bottlers', route0],
  ['efficiency', route1],
  ['heartbreakers', route2],
  ['jinx', route3],
  ['league-comparison', route4],
  ['no-glory', route5],
  ['placements', route6],
  ['streaks', route7],
  ['volatility', route8],
  ['captains', route9],
  ['theoretical', route10],
] as const;
it.each(routes)(
  '%s retains empty HTTP envelope and cache header through real service/query',
  async (name, handler) => {
    const response = await handler(new NextRequest('http://localhost/api/standings'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: name === 'captains' ? { stats: [] } : [],
    });
    expect(response.headers.get('Cache-Control')).toBe(
      `public, max-age=${name === 'captains' ? 0 : 900}, stale-while-revalidate=60`
    );
    expect(mocks.query).toHaveBeenCalled();
  }
);
it.each(routes.filter(([name]) => name !== 'captains'))(
  '%s propagates read failure to private 500',
  async (_, handler) => {
    mocks.query.mockRejectedValue(new Error('synthetic persistence failure'));
    const response = await handler(new NextRequest('http://localhost/api/standings'));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: 'Internal Server Error' });
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
  }
);
it('captain query retains its caught-error empty success', async () => {
  mocks.query.mockRejectedValue(new Error('synthetic persistence failure'));
  const response = await route9(new NextRequest('http://localhost/api/standings/captains'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true, data: { stats: [] } });
});
const advancedTypes = [
  'heat-check',
  'hunter',
  'rolling-avg',
  'floor-ceiling',
  'volatility',
  'distribution',
  'all-play-all',
  'dominance',
  'theoretical-gap',
  'heatmap',
  'position-evolution',
  'reliability',
  'rivalry-matrix',
];
it.each(advancedTypes)(
  'advanced %s retains empty success without explicit HTTP caching',
  async (type) => {
    const response = await advanced(
      new NextRequest('http://localhost/api/standings/advanced?type=' + type)
    );
    expect(response.status).toBe(200);
    const expected =
      type === 'heatmap'
        ? { rounds: [], users: [] }
        : type === 'rivalry-matrix'
          ? { users: [], matrix: {} }
          : type === 'position-evolution'
            ? {
                rounds: [],
                users: [],
                valid: false,
                stats: {
                  biggestClimber: { name: '', change: 0, round: '' },
                  biggestFaller: { name: '', change: 0, round: '' },
                },
              }
            : [];
    expect(await response.json()).toEqual({ success: true, data: expected });
    expect(response.headers.get('Cache-Control')).toBeNull();
  }
);
it('advanced validation retains its bare 400 and first query value', async () => {
  const response = await advanced(
    new NextRequest('http://localhost/api/standings/advanced?type=invalid&type=heatmap')
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: 'Invalid stat type' });
  expect(mocks.query).not.toHaveBeenCalled();
});
it.each([
  ['heatmap', 'advanced:heatmap:1'],
  ['position-evolution', 'advanced:position-changes:1'],
  ['rivalry-matrix', 'advanced:rivalry-matrix:1'],
])('%s retains season-scoped 900-second query cache', async (type, key) => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
  const request = new NextRequest('http://localhost/api/standings/advanced?type=' + type);
  await advanced(request);
  const calls = mocks.query.mock.calls.length;
  expect(getCacheStats().keys).toContain(key);
  await advanced(request);
  expect(mocks.query).toHaveBeenCalledTimes(calls);
  now.mockReturnValue(901001);
  await advanced(request);
  expect(mocks.query.mock.calls.length).toBeGreaterThan(calls);
  mocks.season.mockResolvedValue(2);
  await advanced(request);
  expect(getCacheStats().keys).toContain(key.replace(':1', ':2'));
});
