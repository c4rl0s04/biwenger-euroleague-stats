import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
vi.mock('@/features/players/server', () => ({
  getPlayerRecentScores: vi.fn(async () => [{ playerId: 1, recentScores: '4,X' }]),
}));
vi.mock('@/features/standings/server', () => ({
  getSimpleStandings: vi.fn(async () => [
    { user_id: '7', position: 2, team_value: '100', price_trend: 3 },
  ]),
}));
const reads = vi.hoisted(() => ({
  stats: vi.fn(),
  squad: vi.fn(),
  points: vi.fn(),
  rounds: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: reads.auth }));
vi.mock('./server/queries/manager-stats.query', () => ({ readManagerSeasonStats: reads.stats }));
vi.mock('./server/queries/manager-squad.query', () => ({
  readManagerSquad: reads.squad,
  readManagerPoints: reads.points,
}));
vi.mock('./server/queries/manager-rounds.query', () => ({ readManagerRounds: reads.rounds }));
import { GET as stats } from '@/app/api/player/stats/route';
import { GET as squad } from '@/app/api/player/squad/route';
import { GET as rounds } from '@/app/api/player/rounds/route';
beforeEach(() => {
  vi.clearAllMocks();
  reads.auth.mockResolvedValue(null);
  reads.stats.mockResolvedValue({
    user: { name: 'A', icon: null, color_index: 0, password: 'exclude' },
    transfers: { purchases: 0, sales: 0, total_spent: 0, total_received: 0 },
  });
  reads.squad.mockResolvedValue({
    seasonId: '2026-27',
    rows: [
      {
        id: 1,
        name: null,
        position: null,
        team: null,
        team_img: null,
        team_short_name: null,
        price: '100',
        price_increment: null,
        points: '4',
        average: '4.0',
        img: null,
        token: 'exclude',
      },
    ],
  });
  reads.points.mockResolvedValue('4');
  reads.rounds.mockResolvedValue({
    rounds: [
      {
        round_id: 1,
        round_name: null,
        points: '4',
        position: '2',
        participated: 1,
        password: 'exclude',
      },
    ],
    total_played: 1,
    total_rounds: 1,
  });
});
describe('Managers real HTTP/service/mapper chain', () => {
  it.each([
    ['stats', stats],
    ['squad', squad],
    ['rounds', rounds],
  ] as const)(
    '%s retains private headers, envelopes and no extra record fields',
    async (path, get) => {
      const response = await get(
        new NextRequest('http://localhost/api/player/' + path + '?userId=7')
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(JSON.stringify(body)).not.toContain('exclude');
      if (path === 'stats')
        expect(body.data.stats).toMatchObject({ id: '7', name: 'A', position: 2 });
      if (path === 'squad')
        expect(body.data).toMatchObject({
          total_points: '4',
          players: [{ price: '100', average: '4.0', name: null }],
        });
      if (path === 'rounds')
        expect(body.data.rounds).toEqual([
          { round_id: 1, round_name: null, points: 4, position: 2, participated: 1 },
        ]);
    }
  );
  it('rejects anonymous requests before reads and keeps session fallback', async () => {
    expect((await squad(new NextRequest('http://localhost/api/player/squad'))).status).toBe(400);
    expect(reads.squad).not.toHaveBeenCalled();
    reads.auth.mockResolvedValue({ user: { id: '7' } });
    expect((await squad(new NextRequest('http://localhost/api/player/squad'))).status).toBe(200);
    expect(reads.squad).toHaveBeenCalledWith('7');
  });
});
