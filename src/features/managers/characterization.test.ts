import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const dbMocks = vi.hoisted(() => ({
  query: vi.fn(),
  seasonId: vi.fn(),
  formMap: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: dbMocks.query },
  pgClient: { query: dbMocks.query },
}));

vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: dbMocks.seasonId,
}));

vi.mock('@/lib/db/queries/core/playerForm', () => ({
  getPlayerFormMap: dbMocks.formMap,
}));

const authMocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMocks.auth,
}));

import {
  getAllUsers,
  getUserCaptainStats,
  getUserHomeAwayStats,
  getCaptainRecommendations,
  getPersonalizedAlerts,
} from '@/lib/db/queries/core/users';
import { GET as usersRoute, dynamic as usersDynamic } from '@/app/api/users/route';
import { GET as captainStatsRoute } from '@/app/api/dashboard/captain-stats/route';
import { GET as homeAwayRoute } from '@/app/api/dashboard/home-away/route';
import {
  GET as captainSuggestRoute,
  dynamic as captainSuggestDynamic,
} from '@/app/api/dashboard/captain-suggest/route';

describe('Current main characterization: Managers remaining reads & HTTP contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.seasonId.mockResolvedValue('season-2025-26');
    dbMocks.query.mockResolvedValue({ rows: [] });
    dbMocks.formMap.mockResolvedValue(new Map());
    authMocks.auth.mockResolvedValue(null);
  });

  describe('getAllUsers', () => {
    it('returns manager directory projections without coercing string IDs or null fields', async () => {
      const rows = [
        { id: 'user-1', name: 'Manager One', icon: 'icon-1.png', color_index: 2 },
        { id: 'user-2', name: null, icon: null, color_index: 0 },
      ];
      dbMocks.query.mockResolvedValueOnce({ rows });

      const result = await getAllUsers();
      expect(result).toEqual(rows);
      expect(typeof result[0].id).toBe('string');
      expect(result[1].name).toBeNull();
      expect(result[1].icon).toBeNull();

      expect(dbMocks.query).toHaveBeenCalledTimes(1);
      const [sql, params] = dbMocks.query.mock.calls[0];
      expect(sql).toContain('FROM user_seasons us');
      expect(sql).toContain("us.status = 'active'");
      expect(sql).toContain('ORDER BY us.name ASC, us.user_id ASC');
      expect(params).toEqual(['season-2025-26']);
    });
  });

  describe('getUserCaptainStats', () => {
    it('executes 4 sequential queries with [userId, seasonId] bind order and parses aggregates', async () => {
      dbMocks.query
        // 1. overall
        .mockResolvedValueOnce({
          rows: [{ total_rounds: '5', extra_points: '40', avg_points: '8.0' }],
        })
        // 2. most used
        .mockResolvedValueOnce({
          rows: [
            {
              player_id: 10,
              name: 'Player X',
              times_captain: '3',
              avg_as_captain: '10.5',
              total_as_captain: '31',
            },
          ],
        })
        // 3. best
        .mockResolvedValueOnce({
          rows: [{ name: 'Player X', points: '15' }],
        })
        // 4. worst
        .mockResolvedValueOnce({
          rows: [{ name: 'Player Y', points: '2' }],
        });

      const stats = await getUserCaptainStats('mgr-42');
      expect(stats).toEqual({
        total_rounds: 5,
        extra_points: 40,
        avg_points: 8.0,
        most_used: [
          {
            player_id: 10,
            name: 'Player X',
            times_captain: 3,
            avg_as_captain: 10.5,
            total_as_captain: 31,
          },
        ],
        best_round: { name: 'Player X', points: 15 },
        worst_round: { name: 'Player Y', points: 2 },
      });

      expect(dbMocks.query).toHaveBeenCalledTimes(4);
      for (const call of dbMocks.query.mock.calls) {
        expect(call[1]).toEqual(['mgr-42', 'season-2025-26']);
      }
    });

    it('handles empty rows fallback and SQL null fields', async () => {
      // Empty overall row
      dbMocks.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const emptyResult = await getUserCaptainStats('mgr-empty');
      expect(emptyResult).toEqual({
        total_rounds: 0,
        extra_points: 0,
        avg_points: 0,
        most_used: [],
        best_round: { name: '', points: 0 },
        worst_round: { name: '', points: 0 },
      });

      // Overall row exists but with NULLs (parseInt(null) -> NaN -> JSON null)
      dbMocks.query
        .mockResolvedValueOnce({
          rows: [{ total_rounds: '0', extra_points: null, avg_points: null }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const nullResult = await getUserCaptainStats('mgr-nulls');
      expect(nullResult.extra_points).toBeNaN();
      expect(nullResult.avg_points).toBeNaN();
      expect(JSON.parse(JSON.stringify(nullResult))).toEqual({
        ...emptyResult,
        extra_points: null,
        avg_points: null,
      });
    });

    it('stops sequential execution if an early query fails', async () => {
      const dbError = new Error('db failure');
      dbMocks.query.mockRejectedValueOnce(dbError);

      await expect(getUserCaptainStats('mgr-fail')).rejects.toThrow(dbError);
      expect(dbMocks.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserHomeAwayStats', () => {
    it('executes home/away query with [seasonId, userId] bind order and computes rounded stats', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [
          {
            total_home: '150',
            total_away: '100',
            games_home: '5',
            games_away: '4',
          },
        ],
      });

      const stats = await getUserHomeAwayStats('mgr-42');
      expect(stats).toEqual({
        total_home: 150,
        total_away: 100,
        avg_home: 30, // 150 / 5
        avg_away: 25, // 100 / 4
        difference_pct: 50, // ((150 - 100) / 100) * 100
      });

      expect(dbMocks.query).toHaveBeenCalledTimes(1);
      const [sql, params] = dbMocks.query.mock.calls[0];
      expect(sql).toContain('FROM player_seasons');
      expect(sql).toContain('WHERE season_id = $1 AND owner_id = $2');
      expect(params).toEqual(['season-2025-26', 'mgr-42']);
    });

    it('throws TypeError if rows[0] is absent (missing-row behavior)', async () => {
      dbMocks.query.mockResolvedValueOnce({ rows: [] });
      await expect(getUserHomeAwayStats('mgr-missing')).rejects.toBeInstanceOf(TypeError);
    });

    it('handles zero games without division by zero', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [{ total_home: '0', total_away: '0', games_home: '0', games_away: '0' }],
      });
      const stats = await getUserHomeAwayStats('mgr-zeros');
      expect(stats).toEqual({
        total_home: 0,
        total_away: 0,
        avg_home: 0,
        avg_away: 0,
        difference_pct: 0,
      });
    });
  });

  describe('getCaptainRecommendations', () => {
    it('preserves form label thresholds, recent games parsing, positive form filter, and descending sort', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [
          { player_id: 1, name: 'P1', position: 'G', team_id: 101, team: 'T1' },
          { player_id: 2, name: 'P2', position: 'F', team_id: 102, team: 'T2' },
          { player_id: 3, name: 'P3', position: 'C', team_id: 103, team: 'T3' },
          { player_id: 4, name: 'P4', position: 'G', team_id: 104, team: 'T4' },
          { player_id: 5, name: 'P5', position: 'F', team_id: 105, team: 'T5' },
          { player_id: 6, name: 'P6', position: 'C', team_id: 106, team: 'T6' },
        ],
      });

      const formMap = new Map([
        [1, { player_id: 1, recent_scores: '25,26,27', avg_form_score: 26, avg_recent_points: 26 }],
        [2, { player_id: 2, recent_scores: '18,X,20', avg_form_score: 19, avg_recent_points: 19 }],
        [
          3,
          { player_id: 3, recent_scores: '12,?,13', avg_form_score: 12.5, avg_recent_points: 12.5 },
        ],
        [4, { player_id: 4, recent_scores: '5,0,2', avg_form_score: 2.3, avg_recent_points: 2.3 }],
        [5, { player_id: 5, recent_scores: '0,0,0', avg_form_score: 0, avg_recent_points: 0 }], // Should be filtered out (> 0 filter)
        // 6 has no form entry (avg == null -> 'Sin datos')
      ]);
      dbMocks.formMap.mockResolvedValueOnce(formMap);

      const recommendations = await getCaptainRecommendations('mgr-42', 10);

      // P5 (0 form) and P6 (null form) are filtered out by: avg_recent_points != null && avg_recent_points > 0
      expect(recommendations.map((r) => r.player_id)).toEqual([1, 2, 3, 4]);

      // Form labels
      expect(recommendations[0].form_label).toBe('Excelente forma'); // >= 25
      expect(recommendations[1].form_label).toBe('Buena forma'); // >= 18
      expect(recommendations[2].form_label).toBe('Forma regular'); // >= 12
      expect(recommendations[3].form_label).toBe('Forma baja'); // < 12

      // Recent games count excludes 'X', '?', and ''
      expect(recommendations[0].recent_games).toBe(3);
      expect(recommendations[1].recent_games).toBe(2); // '18,X,20' excludes 'X'
      expect(recommendations[2].recent_games).toBe(2); // '12,?,13' excludes '?'

      expect(dbMocks.formMap).toHaveBeenCalledWith(3);
      const [squadSql, squadParams] = dbMocks.query.mock.calls[0];
      expect(squadSql).toContain('ps.position');
      expect(squadSql).toContain('ps.team_id');
      expect(squadParams).toEqual(['season-2025-26', 'mgr-42']);
    });

    it('respects the default limit of 3', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [
          { player_id: 1, name: 'P1', position: 'G', team_id: 1, team: 'T' },
          { player_id: 2, name: 'P2', position: 'G', team_id: 1, team: 'T' },
          { player_id: 3, name: 'P3', position: 'G', team_id: 1, team: 'T' },
          { player_id: 4, name: 'P4', position: 'G', team_id: 1, team: 'T' },
        ],
      });
      const formMap = new Map([
        [1, { player_id: 1, recent_scores: '30', avg_form_score: 30, avg_recent_points: 30 }],
        [2, { player_id: 2, recent_scores: '25', avg_form_score: 25, avg_recent_points: 25 }],
        [3, { player_id: 3, recent_scores: '20', avg_form_score: 20, avg_recent_points: 20 }],
        [4, { player_id: 4, recent_scores: '15', avg_form_score: 15, avg_recent_points: 15 }],
      ]);
      dbMocks.formMap.mockResolvedValueOnce(formMap);

      const result = await getCaptainRecommendations('mgr-42');
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.player_id)).toEqual([1, 2, 3]);
    });
  });

  describe('getPersonalizedAlerts', () => {
    it('executes 3 queries sequentially and formats price gains, losses, and high performance', async () => {
      dbMocks.query
        // 1. price gains
        .mockResolvedValueOnce({
          rows: [
            { name: 'Gainer 1', price_increment: '1500000' },
            { name: 'Gainer 2', price_increment: '600000' },
          ],
        })
        // 2. price losses
        .mockResolvedValueOnce({
          rows: [{ name: 'Loser 1', price_increment: '-800000' }],
        })
        // 3. recent good form
        .mockResolvedValueOnce({
          rows: [{ name: 'Star Player', fantasy_points: 32 }],
        });

      const alerts = await getPersonalizedAlerts('mgr-42', 5);

      expect(alerts).toEqual([
        {
          type: 'price_gain',
          icon: '📈',
          message: 'Tu jugador Gainer 1 ha ganado 1.50M€',
          severity: 'success',
        },
        {
          type: 'price_gain',
          icon: '📈',
          message: 'Tu jugador Gainer 2 ha ganado 0.60M€',
          severity: 'success',
        },
        {
          type: 'price_loss',
          icon: '📉',
          message: 'Tu jugador Loser 1 ha perdido 0.80M€',
          severity: 'warning',
        },
        {
          type: 'good_performance',
          icon: '⭐',
          message: '¡Star Player brilló con 32 puntos!',
          severity: 'info',
        },
      ]);

      expect(dbMocks.query).toHaveBeenCalledTimes(3);
      // Gains query check
      const [gainsSql, gainsParams] = dbMocks.query.mock.calls[0];
      expect(gainsSql).toContain('ps.price_increment > 500000');
      expect(gainsParams).toEqual(['season-2025-26', 'mgr-42']);

      // Losses query check
      const [lossesSql, lossesParams] = dbMocks.query.mock.calls[1];
      expect(lossesSql).toContain('ps.price_increment < -500000');
      expect(lossesParams).toEqual(['season-2025-26', 'mgr-42']);

      // Good form query check
      const [formSql, formParams] = dbMocks.query.mock.calls[2];
      expect(formSql).toContain('prs.fantasy_points >= 25');
      expect(formParams).toEqual(['season-2025-26', 'mgr-42']);
    });

    it('respects the default limit of 5', async () => {
      dbMocks.query
        .mockResolvedValueOnce({
          rows: [
            { name: 'G1', price_increment: '1000000' },
            { name: 'G2', price_increment: '900000' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { name: 'L1', price_increment: '-1000000' },
            { name: 'L2', price_increment: '-900000' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ name: 'S1', fantasy_points: 30 }],
        });

      const alerts = await getPersonalizedAlerts('mgr-42');
      expect(alerts).toHaveLength(5);
    });
  });

  describe('HTTP Route Contracts', () => {
    it('GET /api/users returns public cache headers and force-dynamic', async () => {
      const rows = [{ id: 'user-1', name: 'User One', icon: null, color_index: 0 }];
      dbMocks.query.mockResolvedValueOnce({ rows });

      const response = await usersRoute();
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=900, stale-while-revalidate=60'
      );
      expect(await response.json()).toEqual({ success: true, data: rows });
      expect(usersDynamic).toBe('force-dynamic');
    });

    it('GET /api/users returns 500 with private no-store headers on error', async () => {
      dbMocks.query.mockRejectedValueOnce(new Error('fail'));

      const response = await usersRoute();
      expect(response.status).toBe(500);
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      expect(await response.json()).toEqual({ success: false, error: 'Internal Server Error' });
    });

    it('GET /api/dashboard/captain-stats returns 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/captain-stats');
      const response = await captainStatsRoute(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    it('GET /api/dashboard/captain-stats returns 200 with private no-store and nested data envelope', async () => {
      dbMocks.query
        .mockResolvedValueOnce({
          rows: [{ total_rounds: '2', extra_points: '10', avg_points: '5' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new NextRequest('http://localhost/api/dashboard/captain-stats?userId=42');
      const response = await captainStatsRoute(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.stats).toBeDefined();
      expect(json.data.stats.total_rounds).toBe(2);
    });

    it('GET /api/dashboard/home-away returns 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/home-away');
      const response = await homeAwayRoute(request);
      expect(response.status).toBe(400);
    });

    it('GET /api/dashboard/home-away returns 200 with private no-store and nested data envelope', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [{ total_home: '50', total_away: '40', games_home: '2', games_away: '2' }],
      });

      const request = new NextRequest('http://localhost/api/dashboard/home-away?userId=42');
      const response = await homeAwayRoute(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.stats).toEqual({
        total_home: 50,
        total_away: 40,
        avg_home: 25,
        avg_away: 20,
        difference_pct: 25,
      });
    });

    it('GET /api/dashboard/captain-suggest returns 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/captain-suggest');
      const response = await captainSuggestRoute(request);
      expect(response.status).toBe(400);
    });

    it('GET /api/dashboard/captain-suggest passes limit=6, returns data array with private no-store and force-dynamic', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [{ player_id: 1, name: 'P1', position: 'G', team_id: 1, team: 'T' }],
      });
      dbMocks.formMap.mockResolvedValueOnce(
        new Map([
          [1, { player_id: 1, recent_scores: '20', avg_form_score: 20, avg_recent_points: 20 }],
        ])
      );

      const request = new NextRequest('http://localhost/api/dashboard/captain-suggest?userId=42');
      const response = await captainSuggestRoute(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data[0].player_id).toBe(1);
      expect(captainSuggestDynamic).toBe('force-dynamic');
    });
  });
});
