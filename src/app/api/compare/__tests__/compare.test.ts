/**
 * Compare API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  getCompareData: vi.fn(),
  getCompareDataLite: vi.fn(),
}));

import * as services from '@/lib/services';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// --- /api/compare/data ---
describe('GET /api/compare/data', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with compare data', async () => {
    const mockData = { users: [], matchups: [] };
    vi.mocked(services.getCompareData).mockResolvedValue(mockData as any);

    const { GET } = await import('@/app/api/compare/data/route');
    const request = makeRequest('http://localhost/api/compare/data');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getCompareData).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/compare/data/route');
    const request = makeRequest('http://localhost/api/compare/data');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});

// --- /api/compare/data/lite ---
describe('GET /api/compare/data/lite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with lite compare data', async () => {
    vi.mocked(services.getCompareDataLite).mockResolvedValue({ users: [] } as any);

    const { GET } = await import('@/app/api/compare/data/lite/route');
    const request = makeRequest('http://localhost/api/compare/data/lite');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.getCompareDataLite).mockRejectedValue(new Error('fail'));

    const { GET } = await import('@/app/api/compare/data/lite/route');
    const request = makeRequest('http://localhost/api/compare/data/lite');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
