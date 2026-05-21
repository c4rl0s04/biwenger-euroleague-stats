/**
 * Standings API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  getFullStandings: vi.fn(),
  fetchRoundWinners: vi.fn(),
  fetchValueRanking: vi.fn(),
  fetchStreakStats: vi.fn(),
  fetchVolatilityStats: vi.fn(),
  fetchEfficiencyStats: vi.fn(),
  fetchPlacementStats: vi.fn(),
  fetchBottlerStats: vi.fn(),
  fetchHeartbreakerStats: vi.fn(),
  fetchNoGloryStats: vi.fn(),
  fetchJinxStats: vi.fn(),
  fetchLeagueComparisonStats: vi.fn(),
  fetchPointsProgression: vi.fn(),
  fetchInitialSquadStats: vi.fn(),
  fetchInitialSquadAnalytics: vi.fn(),
  fetchHeatCheckStats: vi.fn(),
  fetchHunterStats: vi.fn(),
  fetchRollingAverageStats: vi.fn(),
  fetchFloorCeilingStats: vi.fn(),
  fetchPointDistributionStats: vi.fn(),
  fetchAllPlayAllStats: vi.fn(),
  fetchDominanceStats: vi.fn(),
  fetchTheoreticalGapStats: vi.fn(),
  fetchHeatmapStats: vi.fn(),
  fetchPositionChangesStats: vi.fn(),
  fetchReliabilityStats: vi.fn(),
  fetchRivalryMatrixStats: vi.fn(),
  fetchDetailedCaptainStats: vi.fn(),
  getLeagueOverview: vi.fn(),
}));

vi.mock('@/lib/services/app/standingsService', () => ({
  fetchTheoreticalStandings: vi.fn(),
}));

import * as services from '@/lib/services';
import { fetchTheoreticalStandings } from '@/lib/services/app/standingsService';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/standings/full ---
describe('GET /api/standings/full', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with standings data using default sort', async () => {
    const mockStandings = [{ user_id: 1, total_points: 800 }];
    vi.mocked(services.getFullStandings).mockResolvedValue(mockStandings);

    const { GET } = await import('@/app/api/standings/full/route');
    const request = makeRequest('http://localhost/api/standings/full');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockStandings);
    expect(services.getFullStandings).toHaveBeenCalledWith({
      sortBy: 'total_points',
      direction: 'desc',
    });
  });

  it('passes custom sort and direction to service', async () => {
    vi.mocked(services.getFullStandings).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/full/route');
    const request = makeRequest('http://localhost/api/standings/full', {
      sort: 'efficiency',
      dir: 'asc',
    });
    const response = await GET(request);

    expect(services.getFullStandings).toHaveBeenCalledWith({
      sortBy: 'efficiency',
      direction: 'asc',
    });
    expect(response.status).toBe(200);
  });

  it('defaults to desc for invalid direction param', async () => {
    vi.mocked(services.getFullStandings).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/full/route');
    const request = makeRequest('http://localhost/api/standings/full', { dir: 'sideways' });
    await GET(request);

    expect(services.getFullStandings).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'desc' })
    );
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getFullStandings).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/standings/full/route');
    const request = makeRequest('http://localhost/api/standings/full');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

// --- /api/standings/round-winners ---
describe('GET /api/standings/round-winners', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with round winners', async () => {
    vi.mocked(services.fetchRoundWinners).mockResolvedValue([{ user: 'Alice', wins: 5 }]);

    const { GET } = await import('@/app/api/standings/round-winners/route');
    const request = makeRequest('http://localhost/api/standings/round-winners');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchRoundWinners).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/standings/round-winners/route');
    const request = makeRequest('http://localhost/api/standings/round-winners');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

// --- /api/standings/streaks ---
describe('GET /api/standings/streaks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with streak stats', async () => {
    vi.mocked(services.fetchStreakStats).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/streaks/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});

// --- /api/standings/efficiency ---
describe('GET /api/standings/efficiency', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with efficiency stats', async () => {
    vi.mocked(services.fetchEfficiencyStats).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/efficiency/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// --- /api/standings/volatility ---
describe('GET /api/standings/volatility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with volatility data', async () => {
    vi.mocked(services.fetchVolatilityStats).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/volatility/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});

// --- /api/standings/points-progression ---
describe('GET /api/standings/points-progression', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with points progression data', async () => {
    vi.mocked(services.fetchPointsProgression).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/points-progression/route');
    const request = makeRequest('http://localhost/api/standings/points-progression');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

// --- /api/standings/initial-squad-stats ---
describe('GET /api/standings/initial-squad-stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with bestPlayer and retainedRanking', async () => {
    const mockStats = {
      bestDraftPerUser: [
        {
          user_id: '1',
          user_name: 'ask72',
          user_color_index: 0,
          icon: null,
          player_name: 'Coid Miller',
          player_id: 31790,
          total_fantasy_points: 697,
        },
      ],
      retainedRanking: [
        {
          user_id: '1',
          user_name: 'ask72',
          user_color_index: 0,
          icon: null,
          players_contributed: 7,
          total_points: 1600,
        },
      ],
      retainedBreakdown: [],
      regretRanking: [],
      loyaltyRanking: [],
      potentialRanking: [],
      detailedSquads: [],
    };
    vi.mocked(services.fetchInitialSquadStats).mockResolvedValue(mockStats);

    const { GET } = await import('@/app/api/standings/initial-squad-stats/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('bestDraftPerUser');
    expect(json.data).toHaveProperty('retainedRanking');
    expect(json.data.bestDraftPerUser[0].player_name).toBe('Coid Miller');
    expect(json.data.retainedRanking).toHaveLength(1);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchInitialSquadStats).mockRejectedValue(new Error('db fail'));

    const { GET } = await import('@/app/api/standings/initial-squad-stats/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

describe('standings route contract coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  const routeModules = {
    analytics: () => import('@/app/api/standings/analytics/route'),
    bottlers: () => import('@/app/api/standings/bottlers/route'),
    heartbreakers: () => import('@/app/api/standings/heartbreakers/route'),
    jinx: () => import('@/app/api/standings/jinx/route'),
    'league-comparison': () => import('@/app/api/standings/league-comparison/route'),
    'league-totals': () => import('@/app/api/standings/league-totals/route'),
    'no-glory': () => import('@/app/api/standings/no-glory/route'),
    placements: () => import('@/app/api/standings/placements/route'),
    'value-ranking': () => import('@/app/api/standings/value-ranking/route'),
  };

  it.each([
    ['analytics', 'fetchInitialSquadAnalytics'],
    ['bottlers', 'fetchBottlerStats'],
    ['heartbreakers', 'fetchHeartbreakerStats'],
    ['jinx', 'fetchJinxStats'],
    ['league-comparison', 'fetchLeagueComparisonStats'],
    ['league-totals', 'getLeagueOverview'],
    ['no-glory', 'fetchNoGloryStats'],
    ['placements', 'fetchPlacementStats'],
    ['value-ranking', 'fetchValueRanking'],
  ] as const)('covers GET /api/standings/%s', async (route, serviceName) => {
    vi.mocked(services[serviceName]).mockResolvedValue([{ id: route }] as any);

    const { GET } = await routeModules[route]();
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ id: route }]);
  });

  it('covers captains and theoretical standings route envelopes', async () => {
    vi.mocked(services.fetchDetailedCaptainStats).mockResolvedValue([{ userId: '1' }] as any);
    vi.mocked(fetchTheoreticalStandings).mockResolvedValue([{ userId: '2' }] as any);

    const captains = await import('@/app/api/standings/captains/route');
    const theoretical = await import('@/app/api/standings/theoretical/route');

    const captainsResponse = await captains.GET(
      makeRequest('http://localhost/api/standings/captains')
    );
    const theoreticalResponse = await theoretical.GET();

    expect(captainsResponse.status).toBe(200);
    expect((await captainsResponse.json()).data).toEqual({ stats: [{ userId: '1' }] });
    expect(theoreticalResponse.status).toBe(200);
    expect((await theoreticalResponse.json()).data).toEqual([{ userId: '2' }]);
  });

  it('covers advanced stats valid and invalid type contracts', async () => {
    vi.mocked(services.fetchHeatCheckStats).mockResolvedValue([{ id: 'heat-check' }] as any);

    const { GET } = await import('@/app/api/standings/advanced/route');
    const response = await GET(
      makeRequest('http://localhost/api/standings/advanced', { type: 'heat-check' })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [{ id: 'heat-check' }] });

    const invalid = await GET(
      makeRequest('http://localhost/api/standings/advanced', { type: 'unknown' })
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: 'Invalid stat type' });
  });
});
