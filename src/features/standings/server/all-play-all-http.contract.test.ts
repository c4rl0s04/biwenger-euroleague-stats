import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const query = vi.hoisted(() => ({
  resolveAllPlayAllSeason: vi.fn(),
  listAllPlayAllRounds: vi.fn(),
  listAllPlayAllUsers: vi.fn(),
  listAllPlayAllScores: vi.fn(),
}));
const legacy = vi.hoisted(() => ({
  fetchHeatCheckStats: vi.fn(),
  fetchHunterStats: vi.fn(),
  fetchRollingAverageStats: vi.fn(),
  fetchFloorCeilingStats: vi.fn(),
  fetchVolatilityStats: vi.fn(),
  fetchPointDistributionStats: vi.fn(),
  fetchDominanceStats: vi.fn(),
  fetchTheoreticalGapStats: vi.fn(),
  fetchHeatmapStats: vi.fn(),
  fetchPositionChangesStats: vi.fn(),
  fetchReliabilityStats: vi.fn(),
  fetchRivalryMatrixStats: vi.fn(),
}));
vi.mock('@/lib/services', () => legacy);
vi.mock('./queries/all-play-all.query', () => query);
import { clearCache } from '@/lib/utils/cache';
import { GET } from '@/app/api/standings/advanced/route';
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  clearCache();
  vi.resetAllMocks();
  query.resolveAllPlayAllSeason.mockResolvedValue('synthetic');
  query.listAllPlayAllRounds.mockResolvedValue([]);
  query.listAllPlayAllUsers.mockResolvedValue([
    { id: '1', name: null, icon: null, color_index: 0, forbiddenField: 'excluded' },
  ]);
});
afterEach(() => vi.restoreAllMocks());

it.each([undefined, 'authjs.session-token=synthetic'])(
  'keeps all-play-all identity-free and JSON-safe without adding cache headers (%s)',
  async (cookie) => {
    const response = await GET(
      new NextRequest('http://localhost/api/standings/advanced?type=all-play-all&userId=other', {
        headers: cookie ? { cookie } : {},
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBeNull();
    expect(await response.json()).toEqual({
      success: true,
      data: [
        {
          user_id: '1',
          name: null,
          icon: null,
          color_index: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          pct: null,
        },
      ],
    });
  }
);
it('returns success/empty data for caught query failure but 500 for season failure', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  query.listAllPlayAllRounds.mockRejectedValueOnce(new Error('synthetic query failure'));
  const first = await GET(
    new NextRequest('http://localhost/api/standings/advanced?type=all-play-all')
  );
  expect(first.status).toBe(200);
  expect(await first.json()).toEqual({ success: true, data: [] });
  query.resolveAllPlayAllSeason.mockRejectedValueOnce(new Error('synthetic season failure'));
  const second = await GET(
    new NextRequest('http://localhost/api/standings/advanced?type=all-play-all')
  );
  expect(second.status).toBe(500);
  expect(await second.json()).toEqual({ error: 'Internal Server Error' });
  expect(second.headers.get('Cache-Control')).toBeNull();
});
it.each([
  ['heat-check', 'fetchHeatCheckStats'],
  ['hunter', 'fetchHunterStats'],
  ['rolling-avg', 'fetchRollingAverageStats'],
  ['floor-ceiling', 'fetchFloorCeilingStats'],
  ['volatility', 'fetchVolatilityStats'],
  ['distribution', 'fetchPointDistributionStats'],
  ['dominance', 'fetchDominanceStats'],
  ['theoretical-gap', 'fetchTheoreticalGapStats'],
  ['heatmap', 'fetchHeatmapStats'],
  ['position-evolution', 'fetchPositionChangesStats'],
  ['reliability', 'fetchReliabilityStats'],
  ['rivalry-matrix', 'fetchRivalryMatrixStats'],
] as const)('keeps legacy %s dispatch and response unchanged', async (type, method) => {
  legacy[method].mockResolvedValue([{ synthetic: type }]);
  const response = await GET(
    new NextRequest(`http://localhost/api/standings/advanced?type=${type}`)
  );
  expect(await response.json()).toEqual({ success: true, data: [{ synthetic: type }] });
  expect(legacy[method]).toHaveBeenCalledOnce();
  expect(query.resolveAllPlayAllSeason).not.toHaveBeenCalled();
});
it.each(['', '?type=ALL-PLAY-ALL', '?type=unknown', '?type=&type=all-play-all'])(
  'keeps invalid/first-value dispatch behavior %s',
  async (queryString) => {
    const response = await GET(
      new NextRequest(`http://localhost/api/standings/advanced${queryString}`)
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid stat type' });
    expect(query.resolveAllPlayAllSeason).not.toHaveBeenCalled();
  }
);
