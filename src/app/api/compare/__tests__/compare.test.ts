/**
 * Compare API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/features/compare/server', () => ({
  getCompareData: vi.fn(),
  getCompareDataLite: vi.fn(),
}));

import * as services from '@/features/compare/server';
import type { CompareAdvancedStats, CompareDataLiteResponse } from '@/features/compare/public';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('Compare HTTP identity and cache contracts', () => {
  const lite: CompareDataLiteResponse = {
    users: [],
    history: [],
    standings: [],
    porras: [],
    predictions: { achievements: {}, clutch: [], victorias: [], promedios: [], participation: [] },
  };
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(services.getCompareDataLite).mockResolvedValue(lite);
    vi.mocked(services.getCompareData).mockResolvedValue({ ...lite, advancedStats: advanced });
  });
  it.each(['', '?userId=2', '?userId=2abc', '?userId=1&userId=2'])(
    'ignores identity query %s and cookies in both league-wide APIs',
    async (query) => {
      const fullRoute = await import('@/app/api/compare/data/route');
      const liteRoute = await import('@/app/api/compare/data/lite/route');
      for (const [route, name, expected] of [
        [fullRoute, 'data', { ...lite, advancedStats: advanced }],
        [liteRoute, 'data/lite', lite],
      ] as const) {
        expect(route.dynamic).toBe('force-dynamic');
        for (const cookie of [
          '',
          'authjs.session-token=fixture-a',
          'authjs.session-token=fixture-b',
        ]) {
          const response = await route.GET(
            new NextRequest('http://localhost/api/compare/' + name + query, { headers: { cookie } })
          );
          expect(response.status).toBe(200);
          expect(response.headers.get('cache-control')).toBe(
            'public, max-age=300, stale-while-revalidate=60'
          );
          expect(await response.json()).toEqual({ success: true, data: expected });
        }
      }
      expect(services.getCompareData).toHaveBeenCalledWith();
      expect(services.getCompareDataLite).toHaveBeenCalledWith();
    }
  );
  it('keeps private generic errors without logging the thrown payload', async () => {
    const error = new Error('fixture-sensitive-payload');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.mocked(services.getCompareData).mockRejectedValue(error);
      vi.mocked(services.getCompareDataLite).mockRejectedValue(error);
      const fullRoute = await import('@/app/api/compare/data/route');
      const liteRoute = await import('@/app/api/compare/data/lite/route');
      for (const route of [fullRoute, liteRoute]) {
        const response = await route.GET(makeRequest('http://localhost/api/compare/data'));
        expect(response.status).toBe(500);
        expect(response.headers.get('cache-control')).toBe(
          'private, no-store, max-age=0, must-revalidate'
        );
        expect(await response.json()).toEqual({
          success: false,
          error: 'Failed to fetch comparison data',
        });
      }
      expect(JSON.stringify(log.mock.calls)).not.toContain('fixture-sensitive-payload');
    } finally {
      log.mockRestore();
    }
  });
});

// --- /api/compare/data ---
describe('GET /api/compare/data', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with compare data', async () => {
    const mockData = { users: [], matchups: [] };
    vi.mocked(services.getCompareData).mockResolvedValue(mockData as any);

    const { GET } = await import('@/app/api/compare/data/route');
    const request = makeRequest('http://localhost/api/compare/data');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getCompareData).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/compare/data/route');
    const request = makeRequest('http://localhost/api/compare/data');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});

// --- /api/compare/data/lite ---
describe('GET /api/compare/data/lite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with lite compare data', async () => {
    vi.mocked(services.getCompareDataLite).mockResolvedValue({ users: [] } as any);

    const { GET } = await import('@/app/api/compare/data/lite/route');
    const request = makeRequest('http://localhost/api/compare/data/lite');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getCompareDataLite).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/compare/data/lite/route');
    const request = makeRequest('http://localhost/api/compare/data/lite');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
