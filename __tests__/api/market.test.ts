/**
 * Market API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Prevent server-only from throwing in test environment
vi.mock('server-only', () => ({}));

vi.mock('@/lib/services', () => ({
  getMarketPageData: vi.fn(),
  fetchMarketStats: vi.fn(),
  fetchAllTransfers: vi.fn(),
}));

// trends route imports directly from @/lib/db
vi.mock('@/lib/db', () => ({
  getMarketTrendsAnalysis: vi.fn(),
}));

// transfers route imports directly from the service file (bypasses barrel)
vi.mock('@/lib/services/marketService', () => ({
  fetchLiveMarketTransfers: vi.fn(),
}));

import * as services from '@/lib/services';
import * as dbLib from '@/lib/db';
import * as marketService from '@/lib/services/marketService';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/market ---
describe('GET /api/market', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with market data', async () => {
    const mockData = { transfers: [], kpis: {} };
    vi.mocked(services.getMarketPageData).mockResolvedValue(mockData);

    const { GET } = await import('@/app/api/market/route');
    const request = makeRequest('http://localhost/api/market');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('returns 400 for invalid limit parameter', async () => {
    const { GET } = await import('@/app/api/market/route');
    const request = makeRequest('http://localhost/api/market', { limit: 'abc' });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getMarketPageData).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/market/route');
    const request = makeRequest('http://localhost/api/market');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});

// --- /api/market/trends ---
describe('GET /api/market/trends', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for invalid days parameter', async () => {
    const { GET } = await import('@/app/api/market/trends/route');
    const request = makeRequest('http://localhost/api/market/trends', { days: '999' });
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 with trend data for valid days param', async () => {
    const mockData = [{ date: '2025-01-01', count: 5, avg_value: 100000 }];
    vi.mocked(dbLib.getMarketTrendsAnalysis).mockResolvedValue(mockData);

    const { GET } = await import('@/app/api/market/trends/route');
    const request = makeRequest('http://localhost/api/market/trends', { days: '30' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockData);
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(dbLib.getMarketTrendsAnalysis).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/market/trends/route');
    const request = makeRequest('http://localhost/api/market/trends', { days: '30' });
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

// --- /api/market/transfers ---
describe('GET /api/market/transfers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with transfers data', async () => {
    vi.mocked(marketService.fetchLiveMarketTransfers).mockResolvedValue([{ id: 1 }]);

    const { GET } = await import('@/app/api/market/transfers/route');
    const request = makeRequest('http://localhost/api/market/transfers');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(marketService.fetchLiveMarketTransfers).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/market/transfers/route');
    const request = makeRequest('http://localhost/api/market/transfers');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
