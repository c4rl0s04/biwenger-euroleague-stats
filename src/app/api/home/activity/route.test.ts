import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { auth } from '@/auth';

const { getHomeFeedPage } = vi.hoisted(() => ({ getHomeFeedPage: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/services/app/homeService', () => ({ getHomeFeedPage }));

const request = (query = '') => new NextRequest(`http://localhost/api/home/activity${query}`);

describe('GET /api/home/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
    getHomeFeedPage.mockResolvedValue({ items: [], nextCursor: null, hasMore: false });
  });

  it('requires an authenticated server session', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const { GET } = await import('./route');

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(getHomeFeedPage).not.toHaveBeenCalled();
  });

  it('passes the validated filter and opaque cursor and returns private data', async () => {
    const page = { items: [], nextCursor: 'next', hasMore: true };
    getHomeFeedPage.mockResolvedValue(page);
    const { GET } = await import('./route');

    const response = await GET(request('?type=transfers&cursor=opaque'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual(page);
    expect(getHomeFeedPage).toHaveBeenCalledWith({ filter: 'transfers', cursor: 'opaque' });
  });

  it('uses all activity when the type is omitted', async () => {
    const { GET } = await import('./route');

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(getHomeFeedPage).toHaveBeenCalledWith({ filter: 'all', cursor: null });
  });

  it('normalizes the legacy bonuses filter to the combined rounds feed', async () => {
    const { GET } = await import('./route');

    const response = await GET(request('?type=bonuses'));

    expect(response.status).toBe(200);
    expect(getHomeFeedPage).toHaveBeenCalledWith({ filter: 'rounds', cursor: null });
  });

  it('accepts the predictions filter', async () => {
    const { GET } = await import('./route');

    const response = await GET(request('?type=predictions'));

    expect(response.status).toBe(200);
    expect(getHomeFeedPage).toHaveBeenCalledWith({ filter: 'predictions', cursor: null });
  });

  it('keeps MVP and ideal-lineup events in their own filter', async () => {
    const { GET } = await import('./route');

    const response = await GET(request('?type=highlights'));

    expect(response.status).toBe(200);
    expect(getHomeFeedPage).toHaveBeenCalledWith({ filter: 'highlights', cursor: null });
  });

  it('rejects unknown activity filters', async () => {
    const { GET } = await import('./route');

    const response = await GET(request('?type=unknown'));

    expect(response.status).toBe(400);
    expect(getHomeFeedPage).not.toHaveBeenCalled();
  });

  it('rejects invalid cursors', async () => {
    getHomeFeedPage.mockRejectedValue(new Error('Cursor de actividad no válido'));
    const { GET } = await import('./route');

    const response = await GET(request('?cursor=invalid'));

    expect(response.status).toBe(400);
  });

  it('does not accept a client-provided user id', async () => {
    const { GET } = await import('./route');

    const response = await GET(request('?userId=1'));

    expect(response.status).toBe(400);
    expect(getHomeFeedPage).not.toHaveBeenCalled();
  });
});
