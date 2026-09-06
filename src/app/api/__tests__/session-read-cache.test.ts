import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';

const reads = vi.hoisted(() => ({
  fetchUserRecentRounds: vi.fn(),
  fetchUserSeasonStats: vi.fn(),
  fetchUserSquadDetails: vi.fn(),
  fetchCaptainStats: vi.fn(),
  fetchCaptainRecommendations: vi.fn(),
  fetchHomeAwayStats: vi.fn(),
  fetchLeaderComparison: vi.fn(),
}));
vi.mock('@/lib/services', () => reads);
vi.mock('@/features/players/server', () => ({
  getPlayerUserRoundsData: reads.fetchUserRecentRounds,
  getPlayerUserSeasonStatsData: reads.fetchUserSeasonStats,
  getPlayerUserSquadData: reads.fetchUserSquadDetails,
}));

import { GET as rounds } from '../player/rounds/route';
import { GET as stats } from '../player/stats/route';
import { GET as squad } from '../player/squad/route';
import { GET as captains } from '../dashboard/captain-stats/route';
import { GET as suggestions } from '../dashboard/captain-suggest/route';
import { GET as splits } from '../dashboard/home-away/route';
import { GET as gap } from '../dashboard/leader-gap/route';

const noStore = 'private, no-store, max-age=0, must-revalidate';
const cases = [
  {
    path: 'player/rounds',
    get: rounds,
    read: reads.fetchUserRecentRounds,
    nested: false,
    error: 'Failed to fetch rounds',
  },
  {
    path: 'player/stats',
    get: stats,
    read: reads.fetchUserSeasonStats,
    nested: true,
    error: 'synthetic read failure',
  },
  {
    path: 'player/squad',
    get: squad,
    read: reads.fetchUserSquadDetails,
    nested: false,
    error: 'Failed to fetch squad details',
  },
  {
    path: 'dashboard/captain-stats',
    get: captains,
    read: reads.fetchCaptainStats,
    nested: true,
    error: 'Failed to fetch captain stats',
  },
  {
    path: 'dashboard/captain-suggest',
    get: suggestions,
    read: reads.fetchCaptainRecommendations,
    nested: false,
    error: 'Failed to fetch captain suggestions',
  },
  {
    path: 'dashboard/home-away',
    get: splits,
    read: reads.fetchHomeAwayStats,
    nested: true,
    error: 'Failed to fetch home/away stats',
  },
  {
    path: 'dashboard/leader-gap',
    get: gap,
    read: reads.fetchLeaderComparison,
    nested: false,
    error: 'Failed to fetch leader comparison',
  },
];

function setSession(id: string | null) {
  // Auth.js also has middleware overloads; the production resolver calls auth().
  vi.mocked(auth as () => Promise<Session | null>).mockImplementation(async () =>
    id === null ? null : { user: { id }, expires: '2099-01-01T00:00:00.000Z' }
  );
}

describe.each(cases)(
  '$path identity and HTTP cache contract',
  ({ path, get, read, nested, error }) => {
    const request = (id?: string) => {
      const url = new URL(`http://localhost/api/${path}`);
      if (id !== undefined) url.searchParams.set('userId', id);
      return new NextRequest(url);
    };
    const payload = (id: string) => ({ id, total_points: 27, records: [{ round_id: 3 }] });
    const envelope = (id: string) => ({
      success: true,
      data: nested ? { stats: payload(id) } : payload(id),
    });
    const assertResponse = async (response: Response, status: number, body: unknown) => {
      expect(response.status).toBe(status);
      expect(response.headers.get('cache-control')).toBe(noStore);
      expect(response.headers.get('cdn-cache-control')).toBeNull();
      expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
      expect(await response.json()).toEqual(body);
    };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      setSession(null);
      read.mockImplementation(async (id: string) => payload(id));
    });
    afterEach(() => vi.restoreAllMocks());

    it('serves each session its own model at exactly the same URL without permitting storage', async () => {
      const sameUrl = request().url;
      for (const id of ['41', '42']) {
        setSession(id);
        await assertResponse(await get(new NextRequest(sameUrl)), 200, envelope(id));
      }
      expect(read.mock.calls.map(([id]) => id)).toEqual(['41', '42']);
      setSession(null);
      await assertResponse(await get(new NextRequest(sameUrl)), 400, {
        success: false,
        error: 'User ID required (missing or unauthenticated)',
      });
    });

    it.each([undefined, '', 'null', 'undefined'])(
      'preserves session fallback for userId=%s',
      async (id) => {
        setSession('42');
        await assertResponse(await get(request(id)), 200, envelope('42'));
        expect(auth).toHaveBeenCalledOnce();
        expect(read).toHaveBeenCalledWith(
          ...(path.endsWith('captain-suggest') ? ['42', 6] : ['42'])
        );
      }
    );

    it.each([undefined, '', 'null', 'undefined'])(
      'rejects anonymous fallback userId=%s',
      async (id) => {
        await assertResponse(await get(request(id)), 400, {
          success: false,
          error: 'User ID required (missing or unauthenticated)',
        });
        expect(read).not.toHaveBeenCalled();
      }
    );

    it.each([null, '41'])('explicit ID wins without looking up session %s', async (sessionId) => {
      setSession(sessionId);
      await assertResponse(await get(request('42')), 200, envelope('42'));
      expect(auth).not.toHaveBeenCalled();
    });

    it.each(['abc', '0', '-1'])(
      'rejects invalid explicit ID %s without session fallback',
      async (id) => {
        setSession('42');
        await assertResponse(await get(request(id)), 400, {
          success: false,
          error: 'Invalid user ID format',
        });
        expect(auth).not.toHaveBeenCalled();
        expect(read).not.toHaveBeenCalled();
      }
    );

    it.each(['042', '42abc', '1e2'])(
      'preserves legacy accepted ID and original string %s',
      async (id) => {
        await assertResponse(await get(request(id)), 200, envelope(id));
        expect(read.mock.calls[0][0]).toBe(id);
      }
    );

    it('rejects an invalid session ID without reading data', async () => {
      setSession('abc');
      await assertResponse(await get(request()), 400, {
        success: false,
        error: 'Invalid user ID format',
      });
      expect(read).not.toHaveBeenCalled();
    });

    it.each([undefined, '42'])(
      'preserves service failures and no-store for userId=%s',
      async (id) => {
        setSession('41');
        read.mockRejectedValue(new Error('synthetic read failure'));
        await assertResponse(await get(request(id)), 500, { success: false, error });
      }
    );
  }
);
