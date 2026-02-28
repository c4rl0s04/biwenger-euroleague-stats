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
}));

import * as services from '@/lib/services';

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
    const request = makeRequest('http://localhost/api/standings/streaks');
    const response = await GET(request);

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
    const request = makeRequest('http://localhost/api/standings/efficiency');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

// --- /api/standings/volatility ---
describe('GET /api/standings/volatility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with volatility data', async () => {
    vi.mocked(services.fetchVolatilityStats).mockResolvedValue([]);

    const { GET } = await import('@/app/api/standings/volatility/route');
    const request = makeRequest('http://localhost/api/standings/volatility');
    const response = await GET(request);

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
