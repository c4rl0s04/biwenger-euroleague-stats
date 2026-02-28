/**
 * Search API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  performGlobalSearch: vi.fn(),
}));

import * as services from '@/lib/services';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty results when query is missing', async () => {
    const { GET } = await import('@/app/api/search/route');
    const request = makeRequest('http://localhost/api/search');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ players: [], teams: [], users: [] });
    expect(services.performGlobalSearch).not.toHaveBeenCalled();
  });

  it('returns empty results when query is only 1 character', async () => {
    const { GET } = await import('@/app/api/search/route');
    const request = makeRequest('http://localhost/api/search', { q: 'a' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual({ players: [], teams: [], users: [] });
    expect(services.performGlobalSearch).not.toHaveBeenCalled();
  });

  it('calls service with valid query (2+ chars) and returns results', async () => {
    const mockResults = { players: [{ id: 1, name: 'Carlos' }], teams: [], users: [] };
    vi.mocked(services.performGlobalSearch).mockResolvedValue(mockResults as any);

    const { GET } = await import('@/app/api/search/route');
    const request = makeRequest('http://localhost/api/search', { q: 'Carlos' });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockResults);
    expect(services.performGlobalSearch).toHaveBeenCalledWith('Carlos');
  });

  it('returns 500 on service error', async () => {
    vi.mocked(services.performGlobalSearch).mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/search/route');
    const request = makeRequest('http://localhost/api/search', { q: 'Carlos' });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});
