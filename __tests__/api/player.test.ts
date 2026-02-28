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
}));

import * as services from '@/lib/services';

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
    vi.mocked(services.fetchUserSeasonStats).mockResolvedValue(mockStats);

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
    vi.mocked(services.fetchUserRecentRounds).mockResolvedValue(mockRounds);

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
    vi.mocked(services.fetchUserSquadDetails).mockResolvedValue({ players: [] });

    const { GET } = await import('@/app/api/player/squad/route');
    const request = makeRequest('http://localhost/api/player/squad', { userId: '42' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
