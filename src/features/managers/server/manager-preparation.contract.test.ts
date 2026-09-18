import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const dbMocks = vi.hoisted(() => ({
  query: vi.fn(),
  seasonId: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: dbMocks.query },
  pgClient: { query: dbMocks.query },
}));

vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: dbMocks.seasonId,
}));

const playerFormMock = vi.hoisted(() => ({
  getPlayerFormStats: vi.fn(),
}));

vi.mock('@/features/players/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/players/server')>();
  return {
    ...actual,
    getPlayerFormStats: playerFormMock.getPlayerFormStats,
  };
});

const authMocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMocks.auth,
}));

import {
  getManagerCaptainRecommendations,
  getManagerPersonalizedAlerts,
  MANAGER_PREPARATION_POLICY,
} from './services/manager-preparation.service';
import {
  GET as captainSuggestRoute,
  dynamic as captainSuggestDynamic,
} from '@/app/api/dashboard/captain-suggest/route';

describe('Manager Preparation Reads Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.seasonId.mockResolvedValue('season-2025-26');
    dbMocks.query.mockResolvedValue({ rows: [] });
    playerFormMock.getPlayerFormStats.mockResolvedValue([]);
    authMocks.auth.mockResolvedValue(null);
  });

  describe('Policy', () => {
    it('declares caller-resolved identity, private no-store cache, and rounds window', () => {
      expect(MANAGER_PREPARATION_POLICY.captainFormRounds).toBe(3);
      expect(MANAGER_PREPARATION_POLICY.defaultCaptainLimit).toBe(3);
      expect(MANAGER_PREPARATION_POLICY.defaultAlertsLimit).toBe(5);
      expect(MANAGER_PREPARATION_POLICY.httpCache).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      expect(MANAGER_PREPARATION_POLICY.mutations).toBe('none');
    });
  });

  describe('getManagerCaptainRecommendations', () => {
    it('resolves season, queries candidates with ps.position and ps.team_id, and merges form stats', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [
          { player_id: 1, name: 'P1', position: 'G', team_id: 101, team: 'T1' },
          { player_id: 2, name: 'P2', position: 'F', team_id: 102, team: 'T2' },
          { player_id: 3, name: 'P3', position: 'C', team_id: 103, team: 'T3' },
          { player_id: 4, name: 'P4', position: 'G', team_id: 104, team: 'T4' },
          { player_id: 5, name: 'P5', position: 'F', team_id: 105, team: 'T5' },
        ],
      });

      playerFormMock.getPlayerFormStats.mockResolvedValueOnce([
        { playerId: 1, recentScores: '25,26,27', averageRecentPoints: 26, formScore: 26 },
        { playerId: 2, recentScores: '18,X,20', averageRecentPoints: 19, formScore: 19 },
        { playerId: 3, recentScores: '12,?,13', averageRecentPoints: 12.5, formScore: 12.5 },
        { playerId: 4, recentScores: '5,0,2', averageRecentPoints: 2.3, formScore: 2.3 },
        { playerId: 5, recentScores: '0,0,0', averageRecentPoints: 0, formScore: 0 },
      ]);

      const result = await getManagerCaptainRecommendations('user-42', 10);

      expect(result.map((r) => r.player_id)).toEqual([1, 2, 3, 4]);
      expect(result[0].form_label).toBe('Excelente forma');
      expect(result[1].form_label).toBe('Buena forma');
      expect(result[2].form_label).toBe('Forma regular');
      expect(result[3].form_label).toBe('Forma baja');

      expect(result[0].recent_games).toBe(3);
      expect(result[1].recent_games).toBe(2);
      expect(result[2].recent_games).toBe(2);

      expect(playerFormMock.getPlayerFormStats).toHaveBeenCalledWith(3);
      const [sql, params] = dbMocks.query.mock.calls[0];
      expect(sql).toContain('ps.position');
      expect(sql).toContain('ps.team_id');
      expect(params).toEqual(['season-2025-26', 'user-42']);
    });

    it('applies default limit of 3 when limit is not specified', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [
          { player_id: 1, name: 'P1', position: 'G', team_id: 1, team: 'T' },
          { player_id: 2, name: 'P2', position: 'G', team_id: 1, team: 'T' },
          { player_id: 3, name: 'P3', position: 'G', team_id: 1, team: 'T' },
          { player_id: 4, name: 'P4', position: 'G', team_id: 1, team: 'T' },
        ],
      });
      playerFormMock.getPlayerFormStats.mockResolvedValueOnce([
        { playerId: 1, recentScores: '30', averageRecentPoints: 30, formScore: 30 },
        { playerId: 2, recentScores: '25', averageRecentPoints: 25, formScore: 25 },
        { playerId: 3, recentScores: '20', averageRecentPoints: 20, formScore: 20 },
        { playerId: 4, recentScores: '15', averageRecentPoints: 15, formScore: 15 },
      ]);

      const result = await getManagerCaptainRecommendations('user-42');
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.player_id)).toEqual([1, 2, 3]);
    });
  });

  describe('getManagerPersonalizedAlerts', () => {
    it('executes price gains, losses, and recent good form queries sequentially', async () => {
      dbMocks.query
        .mockResolvedValueOnce({
          rows: [{ name: 'G1', price_increment: '1200000' }],
        })
        .mockResolvedValueOnce({
          rows: [{ name: 'L1', price_increment: '-750000' }],
        })
        .mockResolvedValueOnce({
          rows: [{ name: 'Star', fantasy_points: 28 }],
        });

      const alerts = await getManagerPersonalizedAlerts('user-42', 5);

      expect(alerts).toEqual([
        {
          type: 'price_gain',
          icon: '📈',
          message: 'Tu jugador G1 ha ganado 1.20M€',
          severity: 'success',
        },
        {
          type: 'price_loss',
          icon: '📉',
          message: 'Tu jugador L1 ha perdido 0.75M€',
          severity: 'warning',
        },
        {
          type: 'good_performance',
          icon: '⭐',
          message: '¡Star brilló con 28 puntos!',
          severity: 'info',
        },
      ]);

      expect(dbMocks.query).toHaveBeenCalledTimes(3);
      const [gainsSql, gainsParams] = dbMocks.query.mock.calls[0];
      expect(gainsSql).toContain('ps.price_increment > 500000');
      expect(gainsParams).toEqual(['season-2025-26', 'user-42']);

      const [lossesSql, lossesParams] = dbMocks.query.mock.calls[1];
      expect(lossesSql).toContain('ps.price_increment < -500000');
      expect(lossesParams).toEqual(['season-2025-26', 'user-42']);

      const [formSql, formParams] = dbMocks.query.mock.calls[2];
      expect(formSql).toContain('prs.fantasy_points >= 25');
      expect(formParams).toEqual(['season-2025-26', 'user-42']);
    });

    it('applies default limit of 5', async () => {
      dbMocks.query
        .mockResolvedValueOnce({
          rows: [
            { name: 'G1', price_increment: 1000000 },
            { name: 'G2', price_increment: 900000 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { name: 'L1', price_increment: -1000000 },
            { name: 'L2', price_increment: -900000 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ name: 'S1', fantasy_points: 30 }],
        });

      const alerts = await getManagerPersonalizedAlerts('user-42');
      expect(alerts).toHaveLength(5);
    });
  });

  describe('Route Handler: GET /api/dashboard/captain-suggest', () => {
    it('returns 400 if userId is missing', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/captain-suggest');
      const response = await captainSuggestRoute(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    it('returns 200 with private no-store headers and force-dynamic', async () => {
      dbMocks.query.mockResolvedValueOnce({
        rows: [{ player_id: 1, name: 'P1', position: 'G', team_id: 1, team: 'T' }],
      });
      playerFormMock.getPlayerFormStats.mockResolvedValueOnce([
        { playerId: 1, recentScores: '20', averageRecentPoints: 20, formScore: 20 },
      ]);

      const request = new NextRequest('http://localhost/api/dashboard/captain-suggest?userId=42');
      const response = await captainSuggestRoute(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(captainSuggestDynamic).toBe('force-dynamic');
    });
  });
});
