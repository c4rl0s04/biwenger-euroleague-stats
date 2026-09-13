import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  getMarketPageData: vi.fn(),
  fetchMarketStats: vi.fn(),
  fetchBestValueDetails: vi.fn(),
  fetchMarketTrendsAnalysis: vi.fn(),
  fetchLiveMarketTransfers: vi.fn(),
  fetchBiddingDuelDetails: vi.fn(),
}));
vi.mock('@/lib/services', () => mocks);
vi.mock('@/features/market/server', async () => ({
  getMarketPageData: mocks.getMarketPageData,
  getLiveMarketTransfers: mocks.fetchLiveMarketTransfers,
  getBestValueDetails: mocks.fetchBestValueDetails,
  getBiddingDuelDetails: mocks.fetchBiddingDuelDetails,
  ...(await import('@/features/market/validation/market-transfers')),
  getMarketTrendsAnalysis: mocks.fetchMarketTrendsAnalysis,
  ...(await import('@/features/market/validation/market-trends')),
}));
import { GET as market } from '../route';
import { GET as stats } from '../stats/route';
import { GET as value } from '../stats/value-details/route';
import { GET as trends } from '../trends/route';
import { GET as transfers } from '../transfers/route';
import { GET as duels } from '../duels/details/route';
const request = (suffix: string) => new NextRequest(`https://fixture.invalid/api/market${suffix}`);
beforeEach(() => {
  vi.resetAllMocks();
  for (const fn of Object.values(mocks)) fn.mockResolvedValue({ fixture_stat: null, count: '2' });
});
const cases = [
  { route: market, suffix: '?limit=7abc', service: mocks.getMarketPageData, args: [], age: 300 },
  { route: stats, suffix: '/stats', service: mocks.fetchMarketStats, args: [], age: 300 },
  {
    route: value,
    suffix: '/stats/value-details?transferId=7abc',
    service: mocks.fetchBestValueDetails,
    args: [7],
    age: 300,
  },
  {
    route: trends,
    suffix: '/trends?days=30abc',
    service: mocks.fetchMarketTrendsAnalysis,
    args: [30],
    age: 60,
  },
  {
    route: transfers,
    suffix: '/transfers?page=2abc&limit=3.9&buyer=%20Ana%20&seller=%20',
    service: mocks.fetchLiveMarketTransfers,
    args: [{ page: 2, limit: 3, buyer: 'Ana', seller: undefined }],
    age: 60,
  },
  {
    route: duels,
    suffix: '/duels/details?userId=7abc&opponentId=8.9',
    service: mocks.fetchBiddingDuelDetails,
    args: [7, 8],
    age: 60,
  },
];
for (const item of cases) {
  it(`preserves envelope, exact cache header and parsed arguments for ${item.suffix}`, async () => {
    const response = await item.route(request(item.suffix));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { fixture_stat: null, count: '2' },
    });
    expect(response.headers.get('cache-control')).toBe(
      `public, max-age=${item.age}, stale-while-revalidate=60`
    );
    expect(item.service).toHaveBeenCalledExactlyOnceWith(...item.args);
  });
  it(`preserves private errors for ${item.suffix}`, async () => {
    item.service.mockRejectedValue(new Error('fixture read failure'));
    const response = await item.route(request(item.suffix));
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).not.toContain('fixture read failure');
  });
}
it('preserves missing value-details ID default zero despite its positive minimum', async () => {
  expect((await value(request('/stats/value-details'))).status).toBe(200);
  expect(mocks.fetchBestValueDetails).toHaveBeenCalledWith(0);
});
it('rejects identical parsed duel IDs and unsupported trend windows before reading', async () => {
  expect((await duels(request('/duels/details?userId=7abc&opponentId=7'))).status).toBe(400);
  expect((await trends(request('/trends?days=31'))).status).toBe(400);
  expect(mocks.fetchBiddingDuelDetails).not.toHaveBeenCalled();
  expect(mocks.fetchMarketTrendsAnalysis).not.toHaveBeenCalled();
});
