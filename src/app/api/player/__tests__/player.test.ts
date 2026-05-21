/**
 * Player API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  fetchUserSeasonStats: vi.fn(),
  fetchUserRecentRounds: vi.fn(),
  fetchUserSquadDetails: vi.fn(),
  fetchPlayerStreaks: vi.fn(),
  getPlayerProfile: vi.fn(),
  fetchLeagueAveragePoints: vi.fn(),
  fetchStatLeaders: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import * as services from '@/lib/services';
import { auth } from '@/auth';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/player/stats ---
describe('GET /api/player/stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when userId is missing', async () => {
    const { GET } = await import('@/app/api/player/stats/route');
    const request = makeRequest('http://localhost/api/player/stats');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  it('returns 400 when userId is not numeric', async () => {
    const { GET } = await import('@/app/api/player/stats/route');
    const request = makeRequest('http://localhost/api/player/stats', { userId: 'abc' });
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 200 with stats when userId is valid', async () => {
    const mockStats = [{ round: 1, points: 80 }];
    vi.mocked(services.fetchUserSeasonStats).mockResolvedValue(mockStats as any);

    const { GET } = await import('@/app/api/player/stats/route');
    const request = makeRequest('http://localhost/api/player/stats', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.stats).toEqual(mockStats);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchUserSeasonStats).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/player/stats/route');
    const request = makeRequest('http://localhost/api/player/stats', { userId: '42' });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

// --- /api/player/rounds ---
describe('GET /api/player/rounds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when userId is missing', async () => {
    const { GET } = await import('@/app/api/player/rounds/route');
    const request = makeRequest('http://localhost/api/player/rounds');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 with rounds data when userId is valid', async () => {
    const mockRounds = [{ round: 1, points: 75 }];
    vi.mocked(services.fetchUserRecentRounds).mockResolvedValue(mockRounds as any);

    const { GET } = await import('@/app/api/player/rounds/route');
    const request = makeRequest('http://localhost/api/player/rounds', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

// --- /api/player/squad ---
describe('GET /api/player/squad', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when userId is missing', async () => {
    const { GET } = await import('@/app/api/player/squad/route');
    const request = makeRequest('http://localhost/api/player/squad');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 with squad data when userId is valid', async () => {
    vi.mocked(services.fetchUserSquadDetails).mockResolvedValue({ players: [] } as any);

    const { GET } = await import('@/app/api/player/squad/route');
    const request = makeRequest('http://localhost/api/player/squad', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

describe('player and stats route contract coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers GET /api/player/streaks', async () => {
    vi.mocked(services.fetchPlayerStreaks).mockResolvedValue([{ playerId: 1 }] as any);

    const { GET } = await import('@/app/api/player/streaks/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ playerId: 1 }]);
  });

  it('covers GET /api/players/[id]/stats success and not found', async () => {
    vi.mocked(services.getPlayerProfile).mockResolvedValue({ id: '1', name: 'Player' } as any);

    const { GET } = await import('@/app/api/players/[id]/stats/route');
    const response = await GET(makeRequest('http://localhost/api/players/1/stats'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);

    vi.mocked(services.getPlayerProfile).mockResolvedValue(null as any);
    const notFound = await GET(makeRequest('http://localhost/api/players/999/stats'), {
      params: Promise.resolve({ id: '999' }),
    });
    expect(notFound.status).toBe(404);
  });

  it('covers league-average and stat leaders routes', async () => {
    vi.mocked(services.fetchLeagueAveragePoints).mockResolvedValue(75 as any);
    vi.mocked(services.fetchStatLeaders).mockResolvedValue([{ playerId: 1 }] as any);

    const leagueAverage = await import('@/app/api/league-average/route');
    const leaders = await import('@/app/api/stats/leaders/route');

    const averageResponse = await leagueAverage.GET();
    expect(averageResponse.status).toBe(200);
    expect((await averageResponse.json()).data).toEqual({ average: 75 });

    const leadersResponse = await leaders.GET(
      makeRequest('http://localhost/api/stats/leaders', { type: 'rebounds' })
    );
    expect(leadersResponse.status).toBe(200);
    expect(await leadersResponse.json()).toEqual({
      success: true,
      data: [{ playerId: 1 }],
    });
  });
});
