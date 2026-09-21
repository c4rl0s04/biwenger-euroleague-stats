import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ feed: vi.fn() }));
vi.mock('@/features/news/server', () => ({ fetchNewsFeed: mocks.feed }));
vi.mock('@/auth', () => ({
  auth: () => {
    throw new Error('News must not resolve identity');
  },
}));
import { GET, dynamic } from './route';
describe('News HTTP contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it.each([
    { data: [] },
    { data: [{ type: 'transfer', text: 'Synthetic transfer', timestamp: null }] },
  ])('preserves success and public headers', async ({ data }) => {
    mocks.feed.mockResolvedValue(data);
    const response = await GET();
    expect(dynamic).toBe('force-dynamic');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data });
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
    expect(mocks.feed).toHaveBeenCalledWith();
  });
  it.each([new Error('Synthetic failure'), 'non-error'])(
    'preserves unexpected error status/envelope/private headers',
    async (error) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.feed.mockRejectedValue(error);
      const response = await GET();
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      log.mockRestore();
    }
  );
});
