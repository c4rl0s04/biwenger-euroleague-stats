/**
 * Player API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/features/players/server', () => ({
  getPlayerUserSeasonStatsData: vi.fn(),
  getPlayerUserRoundsData: vi.fn(),
  getPlayerUserSquadData: vi.fn(),
  getPlayerStreaksApiData: vi.fn(),
  getPlayerProfileApiData: vi.fn(),
  getPlayerStatLeaders: vi.fn(),
}));

vi.mock('@/lib/services', () => ({
  fetchLeagueAveragePoints: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import * as services from '@/lib/services';
import * as playerServices from '@/features/players/server';
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
    const mockStats = {
      id: '42',
      name: 'Manager',
      icon: '',
      color_index: 0,
      total_points: 80,
      best_round: 80,
      worst_round: 80,
      average_points: 80,
      rounds_played: 1,
      best_position: 1,
      worst_position: 1,
      average_position: 1,
      victories: 1,
      podiums: 1,
      purchases: 0,
      sales: 0,
      total_spent: 0,
      total_received: 0,
      last_transfers: [],
      position: 1,
      team_value: 0,
      price_trend: 0,
    };
    vi.mocked(playerServices.getPlayerUserSeasonStatsData).mockResolvedValue(mockStats);

    const { GET } = await import('@/app/api/player/stats/route');
    const request = makeRequest('http://localhost/api/player/stats', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.stats).toEqual(mockStats);
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
  });

  it('returns 500 on service error', async () => {
    vi.mocked(playerServices.getPlayerUserSeasonStatsData).mockRejectedValue(new Error('DB error'));

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
    const mockRounds = {
      rounds: [{ round_id: 1, round_name: 'Jornada 1', points: 75, position: 1, participated: 1 }],
      total_played: 1,
      total_rounds: 1,
    };
    vi.mocked(playerServices.getPlayerUserRoundsData).mockResolvedValue(mockRounds);

    const { GET } = await import('@/app/api/player/rounds/route');
    const request = makeRequest('http://localhost/api/player/rounds', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockRounds);
    expect(playerServices.getPlayerUserRoundsData).toHaveBeenCalledWith('42');
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
    const squad = {
      players: [],
      top_rising: [],
      top_falling: [],
      total_value: 0,
      price_trend: 0,
      total_points: 0,
      player_count: 0,
      position: 0,
    };
    vi.mocked(playerServices.getPlayerUserSquadData).mockResolvedValue(squad);

    const { GET } = await import('@/app/api/player/squad/route');
    const request = makeRequest('http://localhost/api/player/squad', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(squad);
    expect(playerServices.getPlayerUserSquadData).toHaveBeenCalledWith('42');
  });
});

describe('player and stats route contract coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers GET /api/player/streaks', async () => {
    const streaks = {
      hot: [
        {
          id: 1,
          name: 'Player',
          team_id: 2,
          team_name: 'Madrid',
          position: 'Base',
          games: '3',
          recent_avg: 20,
          season_avg: 10,
          avg_diff: 10,
          trend_pct: 100,
          owner_id: null,
          owner_name: null,
          owner_color_index: 0,
        },
      ],
      cold: [],
    };
    vi.mocked(playerServices.getPlayerStreaksApiData).mockResolvedValue(streaks);

    const { GET } = await import('@/app/api/player/streaks/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(streaks);
  });

  it('covers GET /api/players/[id]/stats success and not found', async () => {
    const profile = {
      id: 1,
      name: 'Player',
      team_id: 2,
      recentMatches: [],
      priceHistory: [],
      nextMatches: [],
    };
    vi.mocked(playerServices.getPlayerProfileApiData).mockResolvedValue(
      profile as unknown as Awaited<ReturnType<typeof playerServices.getPlayerProfileApiData>>
    );

    const { GET } = await import('@/app/api/players/[id]/stats/route');
    const response = await GET(makeRequest('http://localhost/api/players/1/stats'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: profile });
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
    expect(playerServices.getPlayerProfileApiData).toHaveBeenCalledWith('1');

    vi.mocked(playerServices.getPlayerProfileApiData).mockResolvedValue(null);
    const notFound = await GET(makeRequest('http://localhost/api/players/999/stats'), {
      params: Promise.resolve({ id: '999' }),
    });
    expect(notFound.status).toBe(404);
  });

  it('covers league-average and stat leaders routes', async () => {
    vi.mocked(services.fetchLeagueAveragePoints).mockResolvedValue(75);
    const leadersData = [
      {
        player_id: 1,
        name: 'Player',
        team_id: 2,
        team_name: 'Madrid',
        team_code: 'MAD',
        owner_id: null,
        owner_name: null,
        owner_color_index: 0,
        value: 10,
        games_played: '1',
        avg_value: 10,
      },
    ];
    vi.mocked(playerServices.getPlayerStatLeaders).mockResolvedValue(leadersData);

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
      data: leadersData,
    });
  });
});
