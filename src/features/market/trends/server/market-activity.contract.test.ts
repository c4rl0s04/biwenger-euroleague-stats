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
import {
  getMarketPageData,
  getAllTransfers,
  getMarketTrends,
  getMarketKPIs,
} from '@/features/market/server';
import {
  mapMarketActivityTransfer,
  mapMarketActivityTrend,
  mapMarketActivityKPIs,
} from './mappers/market-activity.mapper';
import { GET } from '@/app/api/market/route';

const transfer = {
  id: 9,
  fecha: null,
  player_id: null,
  precio: null,
  vendedor: null,
  comprador: 'Fixture',
};
const rawKPIs = {
  total_transfers: '2',
  avg_value: '3.25',
  max_value: '7',
  min_value: null,
  active_buyers: '1',
  active_sellers: '0',
};
const kpis = {
  total_transfers: 2,
  avg_value: 3.25,
  max_value: 7,
  min_value: 0,
  active_buyers: 1,
  active_sellers: 0,
};
const rawTrend = { date: null, count: '2', avg_value: '3.25' };
const overview = {
  kpis,
  transfers: [transfer],
  trends: [{ date: null, count: 2, avg_value: 3.25 }],
};

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
  dependencies.query.mockImplementation(async (sql: string) => ({
    rows: sql.includes('as total_transfers')
      ? [rawKPIs]
      : sql.includes('TO_CHAR')
        ? [rawTrend]
        : [transfer],
  }));
});

it('preserves the aggregate envelope, independent reads and original query defaults', async () => {
  expect(await getMarketPageData()).toEqual(overview);
  expect(dependencies.season).toHaveBeenCalledTimes(3);
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    ['fixture-season'],
    [100, 0, 'fixture-season'],
    ['fixture-season'],
  ]);
});

it('starts all three constituent reads and propagates failures without a partial overview', async () => {
  dependencies.query.mockRejectedValueOnce(new Error('fixture KPI failure'));
  await expect(getMarketPageData()).rejects.toThrow('fixture KPI failure');
  expect(dependencies.query).toHaveBeenCalledTimes(3);
});

it('allowlists projections rather than spreading raw or nested records', () => {
  expect(mapMarketActivityTransfer({ ...transfer, ...{ internal_field: 'not exposed' } })).toEqual(
    transfer
  );
  expect(mapMarketActivityTrend({ ...rawTrend, ...{ internal_field: 'not exposed' } })).toEqual(
    overview.trends[0]
  );
  expect(mapMarketActivityKPIs({ ...rawKPIs, ...{ internal_field: 'not exposed' } })).toEqual(kpis);
});

it('retains empty and invalid aggregate numeric fallbacks', async () => {
  dependencies.query.mockResolvedValue({ rows: [] });
  expect(await getMarketPageData()).toEqual({
    kpis: {
      total_transfers: 0,
      avg_value: 0,
      max_value: 0,
      min_value: 0,
      active_buyers: 0,
      active_sellers: 0,
    },
    transfers: [],
    trends: [],
  });
  expect(mapMarketActivityTrend({ date: null, count: 'invalid', avg_value: null })).toEqual({
    date: null,
    count: 0,
    avg_value: 0,
  });
});

it('preserves explicit pagination for internal reads and does not add a server cache', async () => {
  expect(await getAllTransfers(4, 8)).toEqual([transfer]);
  expect(await getMarketTrends()).toEqual(overview.trends);
  expect(await getMarketKPIs()).toEqual(kpis);
  await getMarketKPIs();
  expect(dependencies.query.mock.calls[0][1]).toEqual([4, 8, 'fixture-season']);
  expect(dependencies.season).toHaveBeenCalledTimes(4);
  expect(dependencies.query).toHaveBeenCalledTimes(4);
});

it('preserves the public route contract and the deliberately unused validated limit', async () => {
  const response = await GET(new NextRequest('https://fixture.invalid/api/market?limit=7abc'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe(
    'public, max-age=300, stale-while-revalidate=60'
  );
  expect(await response.json()).toEqual({ success: true, data: overview });
  expect(dependencies.query.mock.calls[1][1]).toEqual([100, 0, 'fixture-season']);
});

it.each(['0', '501', 'invalid'])(
  'rejects invalid summary limit %s before data access',
  async (limit) => {
    const response = await GET(
      new NextRequest(`https://fixture.invalid/api/market?limit=${limit}`)
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    expect(dependencies.season).not.toHaveBeenCalled();
    expect(dependencies.query).not.toHaveBeenCalled();
  }
);

it('retains the generic private error envelope on failed reads', async () => {
  dependencies.query.mockRejectedValue(new Error('fixture internal failure'));
  const response = await GET(new NextRequest('https://fixture.invalid/api/market'));
  expect(response.status).toBe(500);
  expect(response.headers.get('cache-control')).toBe(
    'private, no-store, max-age=0, must-revalidate'
  );
  expect(await response.json()).toEqual({ success: false, error: 'Failed to fetch market data' });
});
