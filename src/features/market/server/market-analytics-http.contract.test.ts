import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { GET, dynamic } from '@/app/api/market/stats/route';
import { MARKET_ANALYTICS_POLICY } from '../server';

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockImplementation(async (sql: string) => {
    if (sql.includes('WITH BidStats'))
      return { rows: [{ total_volume: null, total_ops: '0', avg_price: null, avg_bids: null }] };
    if (sql.includes('ORDER BY COALESCE(us.name, u.name) ASC, u.id ASC'))
      return {
        rows: [
          {
            id: '007',
            name: 'Fixture Manager',
            icon: null,
            color_index: 0,
            credential: 'synthetic-canary',
          },
        ],
      };
    return { rows: [] };
  });
});

it('runs the real aggregate with allowlisted directory, exact cache/envelope and no identity input', async () => {
  const response = await GET();
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe(
    'public, max-age=300, stale-while-revalidate=60'
  );
  expect(dynamic).toBe('force-dynamic');
  expect(MARKET_ANALYTICS_POLICY.identity).toBe('none');
  expect(MARKET_ANALYTICS_POLICY.serverCache).toBe('none');
  expect(body.success).toBe(true);
  expect(body.data.kpis).toEqual({ totalVolume: 0, totalOps: 0, avgPrice: 0, avgBids: 0 });
  expect(body.data.allUsers).toEqual([
    { id: '007', name: 'Fixture Manager', icon: null, color_index: 0 },
  ]);
  expect(body.data.biddingDuels).toEqual({
    users: [],
    matrix: {},
    hottestRivalry: null,
    biggestDominance: null,
  });
  expect(Object.keys(body.data)).toHaveLength(31);
  expect(JSON.stringify(body)).not.toContain('synthetic-canary');
  const calls = fake.query.mock.calls.length;
  await GET();
  expect(fake.query).toHaveBeenCalledTimes(calls * 2);
  for (const [, args] of fake.query.mock.calls) expect(args).toContain('fixture-season');
});

it('preserves generic private failures from the real service chain', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    fake.season.mockRejectedValue(new Error('fixture failure'));
    const response = await GET();
    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Failed to fetch market stats',
    });
    expect(fake.query).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
  }
});
