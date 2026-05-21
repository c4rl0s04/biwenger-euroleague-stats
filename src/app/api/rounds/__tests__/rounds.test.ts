/**
 * Rounds API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  fetchRoundCompleteData: vi.fn(),
  fetchUserRoundDetails: vi.fn(),
  fetchRoundLeaderboard: vi.fn(),
  fetchRoundsList: vi.fn(),
  fetchRoundStandings: vi.fn(),
  fetchAllUsersPerformanceHistory: vi.fn(),
  getUserPerformanceHistoryService: vi.fn(),
  fetchUserLineup: vi.fn(),
}));

vi.mock('@/lib/services/core/roundsService', () => ({
  fetchLineupStats: vi.fn(),
}));

import * as services from '@/lib/services';
import { fetchLineupStats } from '@/lib/services/core/roundsService';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/rounds/stats ---
describe('GET /api/rounds/stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 500 when roundId is missing', async () => {
    const { GET } = await import('@/app/api/rounds/stats/route');
    const request = makeRequest('http://localhost/api/rounds/stats');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  it('returns 200 in default mode with roundId', async () => {
    vi.mocked(services.fetchUserRoundDetails).mockResolvedValue({ round: {}, users: [] } as any);

    const { GET } = await import('@/app/api/rounds/stats/route');
    const request = makeRequest('http://localhost/api/rounds/stats', { roundId: '5' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 200 in quick mode with roundId and userId', async () => {
    vi.mocked(services.fetchRoundCompleteData).mockResolvedValue({ round: {}, data: [] } as any);

    const { GET } = await import('@/app/api/rounds/stats/route');
    const request = makeRequest('http://localhost/api/rounds/stats', {
      roundId: '5',
      userId: '42',
      mode: 'quick',
    });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 in quick mode when userId is missing', async () => {
    const { GET } = await import('@/app/api/rounds/stats/route');
    const request = makeRequest('http://localhost/api/rounds/stats', {
      roundId: '5',
      mode: 'quick',
    });
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

// --- /api/rounds/list ---
describe('GET /api/rounds/list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with rounds list', async () => {
    vi.mocked(services.fetchRoundsList).mockResolvedValue([{ id: 1, name: 'Round 1' }] as any);

    const { GET } = await import('@/app/api/rounds/list/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchRoundsList).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/rounds/list/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

describe('rounds route contract coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers history and all-history response envelopes', async () => {
    vi.mocked(services.getUserPerformanceHistoryService).mockResolvedValue([{ roundId: 1 }] as any);
    vi.mocked(services.fetchAllUsersPerformanceHistory).mockResolvedValue([{ userId: '1' }] as any);

    const history = await import('@/app/api/rounds/history/route');
    const allHistory = await import('@/app/api/rounds/all-history/route');

    const historyResponse = await history.GET(
      makeRequest('http://localhost/api/rounds/history', { userId: '42' })
    );
    const allHistoryResponse = await allHistory.GET();

    expect(historyResponse.status).toBe(200);
    expect((await historyResponse.json()).data).toEqual({ history: [{ roundId: 1 }] });
    expect(allHistoryResponse.status).toBe(200);
    expect((await allHistoryResponse.json()).data).toEqual({
      allUsersHistory: [{ userId: '1' }],
    });
  });

  it('covers leaderboard, standings, lineup, and lineup-stats envelopes', async () => {
    vi.mocked(services.fetchRoundLeaderboard).mockResolvedValue([{ userId: '1' }] as any);
    vi.mocked(services.fetchRoundStandings).mockResolvedValue([{ userId: '2' }] as any);
    vi.mocked(services.fetchUserLineup).mockResolvedValue([{ playerId: 1 }] as any);
    vi.mocked(fetchLineupStats).mockResolvedValue([{ roundId: 1 }] as any);

    const leaderboard = await import('@/app/api/rounds/leaderboard/route');
    const standings = await import('@/app/api/rounds/standings/route');
    const lineup = await import('@/app/api/rounds/lineup/route');
    const lineupStats = await import('@/app/api/rounds/lineup-stats/route');

    const leaderboardResponse = await leaderboard.GET();
    const standingsResponse = await standings.GET(
      makeRequest('http://localhost/api/rounds/standings', { roundId: '5' })
    );
    const lineupResponse = await lineup.GET(
      makeRequest('http://localhost/api/rounds/lineup', { roundId: '5', userId: '42' })
    );
    const lineupStatsResponse = await lineupStats.GET();

    expect((await leaderboardResponse.json()).data).toEqual({
      leaderboard: [{ userId: '1' }],
    });
    expect((await standingsResponse.json()).success).toBe(true);
    expect((await lineupResponse.json()).success).toBe(true);
    expect((await lineupStatsResponse.json()).success).toBe(true);
  });

  it('keeps required-param failures stable', async () => {
    const history = await import('@/app/api/rounds/history/route');
    const standings = await import('@/app/api/rounds/standings/route');
    const lineup = await import('@/app/api/rounds/lineup/route');

    expect((await history.GET(makeRequest('http://localhost/api/rounds/history'))).status).toBe(
      400
    );
    expect((await standings.GET(makeRequest('http://localhost/api/rounds/standings'))).status).toBe(
      400
    );
    expect((await lineup.GET(makeRequest('http://localhost/api/rounds/lineup'))).status).toBe(400);
  });
});
