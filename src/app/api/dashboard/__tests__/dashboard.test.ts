/**
 * Dashboard API Route Tests
 * Tests the thin handler layer: validates input, calls service, returns response.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mock all services ---
vi.mock('@/lib/services', () => ({
  fetchPlayerBirthdays: vi.fn(),
  fetchTopPlayers: vi.fn(),
  fetchCaptainStats: vi.fn(),
  fetchCaptainRecommendations: vi.fn(),
  fetchHomeAwayStats: vi.fn(),
  fetchLastRoundStats: vi.fn(),
  fetchLastRoundMVPs: vi.fn(),
  fetchNextRound: vi.fn(),
  getRecentActivityData: vi.fn(),
  fetchRisingStars: vi.fn(),
  fetchTopPlayersByForm: vi.fn(),
  fetchLeaderComparison: vi.fn(),
  getNextRoundData: vi.fn(),
  fetchMarketOpportunities: vi.fn(),
}));

import * as services from '@/lib/services';

function mockRequest(
  path = 'http://localhost/api/dashboard',
  params: Record<string, string> = {}
): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/dashboard/birthdays ---
describe('GET /api/dashboard/birthdays', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with birthday data', async () => {
    const mockData = [{ name: 'Player A', birthday: '03-01' }];
    vi.mocked(services.fetchPlayerBirthdays).mockResolvedValue(mockData as any);

    const { GET } = await import('@/app/api/dashboard/birthdays/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchPlayerBirthdays).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/dashboard/birthdays/route');
    const response = await GET();

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});

// --- /api/dashboard/top-players ---
describe('GET /api/dashboard/top-players', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with top players data', async () => {
    const mockData = [{ id: 1, name: 'Player A', score: 30 }];
    vi.mocked(services.fetchTopPlayers).mockResolvedValue(mockData as any);

    const { GET } = await import('@/app/api/dashboard/top-players/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchTopPlayers).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/dashboard/top-players/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

// --- /api/dashboard/rising-stars ---
describe('GET /api/dashboard/rising-stars', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with rising stars data', async () => {
    const mockData = [{ id: 2, name: 'Rising Star' }];
    vi.mocked(services.fetchRisingStars).mockResolvedValue(mockData as any);

    const { GET } = await import('@/app/api/dashboard/rising-stars/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchRisingStars).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/dashboard/rising-stars/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

// --- /api/dashboard/top-form ---
describe('GET /api/dashboard/top-form', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with top form data', async () => {
    vi.mocked(services.fetchTopPlayersByForm).mockResolvedValue([
      { id: 3, name: 'Hot Player' },
    ] as any);

    const { GET } = await import('@/app/api/dashboard/top-form/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

describe('dashboard route contract coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers captain-stats success and missing userId error envelope', async () => {
    vi.mocked(services.fetchCaptainStats).mockResolvedValue({ total: 1 } as any);

    const { GET } = await import('@/app/api/dashboard/captain-stats/route');
    const okResponse = await GET(
      mockRequest('http://localhost/api/dashboard/captain-stats', { userId: '42' })
    );
    const okJson = await okResponse.json();
    expect(okResponse.status).toBe(200);
    expect(okJson).toEqual({ success: true, data: { stats: { total: 1 } } });

    const badResponse = await GET(mockRequest('http://localhost/api/dashboard/captain-stats'));
    const badJson = await badResponse.json();
    expect(badResponse.status).toBe(400);
    expect(badJson.success).toBe(false);
  });

  it('covers captain-suggest success envelope', async () => {
    vi.mocked(services.fetchCaptainRecommendations).mockResolvedValue([{ id: 1 }] as any);

    const { GET } = await import('@/app/api/dashboard/captain-suggest/route');
    const response = await GET(
      mockRequest('http://localhost/api/dashboard/captain-suggest', { userId: '42' })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ id: 1 }]);
  });

  it('covers home-away and leader-gap user-scoped routes', async () => {
    vi.mocked(services.fetchHomeAwayStats).mockResolvedValue({ home: 1 } as any);
    vi.mocked(services.fetchLeaderComparison).mockResolvedValue({ gap: 10 } as any);

    const homeAway = await import('@/app/api/dashboard/home-away/route');
    const leaderGap = await import('@/app/api/dashboard/leader-gap/route');

    const homeResponse = await homeAway.GET(
      mockRequest('http://localhost/api/dashboard/home-away', { userId: '42' })
    );
    const gapResponse = await leaderGap.GET(
      mockRequest('http://localhost/api/dashboard/leader-gap', { userId: '42' })
    );

    expect(homeResponse.status).toBe(200);
    expect((await homeResponse.json()).data).toEqual({ stats: { home: 1 } });
    expect(gapResponse.status).toBe(200);
    expect((await gapResponse.json()).data).toEqual({ gap: 10 });
  });

  it('covers simple dashboard data routes and cache envelopes', async () => {
    vi.mocked(services.fetchLastRoundStats).mockResolvedValue([
      { player_id: 1, round_name: 'J1', position: 'Base', points: 10 },
    ] as any);
    vi.mocked(services.fetchMarketOpportunities).mockResolvedValue([{ id: 2 }] as any);
    vi.mocked(services.fetchLastRoundMVPs).mockResolvedValue([{ id: 3 }] as any);
    vi.mocked(services.fetchNextRound).mockResolvedValue({ id: 4 } as any);
    vi.mocked(services.getRecentActivityData).mockResolvedValue([{ id: 5 }] as any);

    const ideal = await import('@/app/api/dashboard/ideal-lineup/route');
    const market = await import('@/app/api/dashboard/market-opportunities/route');
    const mvps = await import('@/app/api/dashboard/mvps/route');
    const next = await import('@/app/api/dashboard/next-round/route');
    const recent = await import('@/app/api/dashboard/recent-activity/route');

    for (const response of [
      await ideal.GET(),
      await market.GET(),
      await mvps.GET(),
      await next.GET(),
      await recent.GET(
        mockRequest('http://localhost/api/dashboard/recent-activity', { userId: '42' })
      ),
    ]) {
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    }
  });
});
