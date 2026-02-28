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
  fetchRoundHistory: vi.fn(),
  fetchAllRoundHistory: vi.fn(),
  fetchRoundLineup: vi.fn(),
  fetchRoundLineupStats: vi.fn(),
}));

import * as services from '@/lib/services';

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
    vi.mocked(services.fetchUserRoundDetails).mockResolvedValue({ round: {}, users: [] });

    const { GET } = await import('@/app/api/rounds/stats/route');
    const request = makeRequest('http://localhost/api/rounds/stats', { roundId: '5' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 200 in quick mode with roundId and userId', async () => {
    vi.mocked(services.fetchRoundCompleteData).mockResolvedValue({ round: {}, data: [] });

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
    vi.mocked(services.fetchRoundsList).mockResolvedValue([{ id: 1, name: 'Round 1' }]);

    const { GET } = await import('@/app/api/rounds/list/route');
    const request = makeRequest('http://localhost/api/rounds/list');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.fetchRoundsList).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/rounds/list/route');
    const request = makeRequest('http://localhost/api/rounds/list');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
