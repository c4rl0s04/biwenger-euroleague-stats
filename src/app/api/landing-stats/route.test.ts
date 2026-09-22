import { beforeEach, expect, it, vi } from 'vitest';
const { read, auth } = vi.hoisted(() => ({
  read: vi.fn(),
  auth: vi.fn(() => {
    throw new Error('must not resolve identity');
  }),
}));
vi.mock('@/features/home/server', () => ({ fetchLandingStats: read }));
vi.mock('@/auth', () => ({ auth }));
import { GET, dynamic } from './route';
const payload = {
  seasonName: 'Season',
  userCount: 2,
  currentRound: 'Pre-Season',
  weeksToPlayoffs: 0,
  playoffStartRound: 39,
};
beforeEach(() => {
  vi.clearAllMocks();
  read.mockResolvedValue(payload);
});
it('preserves the public parameterless landing envelope and exact cache policy', async () => {
  expect(dynamic).toBe('force-dynamic');
  for (const cookie of ['', 'authjs.session-token=synthetic']) {
    // Framework supplies a request, but this parameterless route deliberately ignores it.
    const response = await (GET as (request?: Request) => ReturnType<typeof GET>)(
      new Request('http://localhost/api/landing-stats?userId=other', { headers: { cookie } })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
    expect(await response.json()).toEqual({ success: true, data: payload });
  }
  expect(auth).not.toHaveBeenCalled();
  expect(read.mock.calls).toEqual([[], []]);
});
it.each([new Error('synthetic failure'), null])(
  'preserves private 500 errors for %s',
  async (error) => {
    read.mockRejectedValue(error);
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await GET();
      expect(response.status).toBe(500);
      expect(response.headers.get('cache-control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      expect(await response.json()).toEqual({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch landing stats',
      });
    } finally {
      logger.mockRestore();
    }
  }
);
