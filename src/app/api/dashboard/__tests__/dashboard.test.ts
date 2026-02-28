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
  fetchStandingsPreview: vi.fn(),
  fetchTopPlayersByForm: vi.fn(),
  fetchLeaderComparison: vi.fn(),
  getNextRoundData: vi.fn(),
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

// --- /api/dashboard/standings-preview ---
describe('GET /api/dashboard/standings-preview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with standings preview', async () => {
    vi.mocked(services.fetchStandingsPreview).mockResolvedValue([
      { rank: 1, user: 'Alice' },
    ] as any);

    const { GET } = await import('@/app/api/dashboard/standings-preview/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
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
