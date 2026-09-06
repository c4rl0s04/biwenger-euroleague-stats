import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));

import { GET } from '@/app/api/search/route';
import { globalSearch } from '@/lib/db/queries/features/search';
import { performGlobalSearch as legacySearch } from '@/lib/services/features/searchService';
import { performGlobalSearch } from '../server';

const empty = { players: [], teams: [], users: [] };
const publicCache = 'public, max-age=60, stale-while-revalidate=60';

describe('real Search HTTP/service/query contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReset().mockResolvedValue({ rows: [] });
    mocks.season.mockReset().mockResolvedValue('2026-27');
  });

  it.each(['', '?q=', '?q=a', '?q=%20a%20', '?q=%09%0A'])(
    'keeps empty success and cache for %s',
    async (suffix) => {
      const response = await GET(new NextRequest(`http://localhost/api/search${suffix}`));
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe(publicCache);
      expect(await response.json()).toEqual({ success: true, data: empty });
      expect(mocks.season).not.toHaveBeenCalled();
      expect(mocks.query).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, 'synthetic-session-cookie'])(
    'ignores identity for public allowlisted results (cookie %s)',
    async (cookie) => {
      mocks.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 7,
              name: 'Player',
              img: 'p.png',
              position: null,
              team: null,
              price: null,
              points: '25',
              privateExtra: 'excluded',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 8, name: 'Club', player_count: '0', privateExtra: 'excluded' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: '009', name: 'Manager', icon: null, privateExtra: 'excluded' }],
        });
      const response = await GET(
        new NextRequest('http://localhost/api/search?q=%20ab%20&q=ignored&limit=100&userId=other', {
          headers: cookie ? { cookie } : {},
        })
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe(publicCache);
      expect(await response.json()).toEqual({
        success: true,
        data: {
          players: [
            {
              id: 7,
              name: 'Player',
              img: 'p.png',
              position: null,
              team: null,
              price: null,
              points: 25,
            },
          ],
          teams: [{ id: 8, name: 'Club', player_count: 0 }],
          users: [{ id: '009', name: 'Manager', icon: null }],
        },
      });
      expect(mocks.season).toHaveBeenCalledWith();
      expect(mocks.query.mock.calls.map((call) => call[1])).toEqual(
        Array(3).fill(['%ab%', '2026-27', 5])
      );
    }
  );

  it('preserves parameterized wildcard SQL, season scope, filters and category ordering', async () => {
    await performGlobalSearch("%_'", 9);
    const calls = mocks.query.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls.map((call) => call[1])).toEqual(Array(3).fill(["%%_'%", '2026-27', 9]));
    expect(calls[0][0]).toContain('p.name ILIKE $1');
    expect(calls[0][0]).toContain('AND ps.season_id = $2');
    expect(calls[0][0]).toContain("opm.provider='euroleague_advanced' AND opm.status='matched'");
    expect(calls[0][0]).toContain('AND COALESCE(opm.image_url,p.img) IS NOT NULL');
    expect(calls[0][0]).toContain('AND COALESCE(ps.team_id, p.team_id) IS NOT NULL');
    expect(calls[0][0]).toContain('ORDER BY COALESCE(ps.puntos, p.puntos) DESC');
    expect(calls[1][0]).toContain(
      'LEFT JOIN player_seasons ps ON ps.team_id = t.id AND ps.season_id = $2'
    );
    expect(calls[1][0]).toContain('ORDER BY player_count DESC');
    expect(calls[2][0]).toContain("AND COALESCE(us.status, 'active') = 'active'");
    expect(calls[2][0]).toContain('ORDER BY COALESCE(us.name, u.name)');
    for (const [sql] of calls) expect(sql).toContain('LIMIT $3');
  });

  it.each([0, 1, 2, 3])(
    'preserves error envelope, no-store and sequential fail-fast at stage %s',
    async (stage) => {
      const failure = new Error('synthetic failure');
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      if (stage === 0) mocks.season.mockRejectedValueOnce(failure);
      else {
        for (let i = 1; i < stage; i++) mocks.query.mockResolvedValueOnce({ rows: [] });
        mocks.query.mockRejectedValueOnce(failure);
      }
      const response = await GET(new NextRequest('http://localhost/api/search?q=ab'));
      expect(response.status).toBe(500);
      expect(response.headers.get('cache-control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      expect(await response.json()).toEqual({ success: false, error: 'Failed to search' });
      expect(mocks.query).toHaveBeenCalledTimes(stage);
      log.mockRestore();
    }
  );

  it('retains legacy adapters to the single implementation', async () => {
    expect(globalSearch).toBe(performGlobalSearch);
    expect(legacySearch).toBe(performGlobalSearch);
    expect(await globalSearch('ab', 3)).toEqual(empty);
    expect(mocks.query.mock.calls[0][1]).toEqual(['%ab%', '2026-27', 3]);
  });
});
