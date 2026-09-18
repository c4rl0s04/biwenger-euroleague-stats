import { describe, it, expect } from 'vitest';
import { mapCaptainRecommendations, mapManagerAlerts } from './manager-preparation.mapper';

describe('manager-preparation.mapper', () => {
  describe('mapCaptainRecommendations', () => {
    it('returns empty array when candidates are empty', () => {
      expect(mapCaptainRecommendations([], [])).toEqual([]);
    });

    it('maps form score thresholds and recent games correctly', () => {
      const candidates = [
        { player_id: 1, name: 'Player 1', position: 'G', team_id: 10, team: 'Team A' },
        { player_id: 2, name: 'Player 2', position: 'F', team_id: 20, team: 'Team B' },
        { player_id: 3, name: 'Player 3', position: 'C', team_id: 30, team: 'Team C' },
        { player_id: 4, name: 'Player 4', position: 'G', team_id: 40, team: 'Team D' },
        { player_id: 5, name: 'Player 5', position: 'F', team_id: 50, team: 'Team E' },
        { player_id: 6, name: 'Player 6', position: 'C', team_id: 60, team: 'Team F' },
      ];

      const formStats = [
        { playerId: 1, recentScores: '25,26,27', averageRecentPoints: 26, formScore: 26 },
        { playerId: 2, recentScores: '18,X,20', averageRecentPoints: 19, formScore: 19 },
        { playerId: 3, recentScores: '12,?,13', averageRecentPoints: 12.5, formScore: 12.5 },
        { playerId: 4, recentScores: '5,0,2', averageRecentPoints: 2.3, formScore: 2.3 },
        { playerId: 5, recentScores: '0,0,0', averageRecentPoints: 0, formScore: 0 },
      ];

      const result = mapCaptainRecommendations(candidates, formStats, 10);

      // Player 5 (score 0) and Player 6 (no form) filtered out
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        player_id: 1,
        name: 'Player 1',
        position: 'G',
        team_id: 10,
        team: 'Team A',
        avg_recent_points: 26,
        recent_games: 3,
        recent_scores: '25,26,27',
        form_label: 'Excelente forma',
      });
      expect(result[1].form_label).toBe('Buena forma');
      expect(result[1].recent_games).toBe(2);
      expect(result[2].form_label).toBe('Forma regular');
      expect(result[2].recent_games).toBe(2);
      expect(result[3].form_label).toBe('Forma baja');
      expect(result[3].recent_games).toBe(3);
    });

    it('respects the limit argument', () => {
      const candidates = [
        { player_id: 1, name: 'P1', position: 'G', team_id: 1, team: 'T' },
        { player_id: 2, name: 'P2', position: 'G', team_id: 1, team: 'T' },
        { player_id: 3, name: 'P3', position: 'G', team_id: 1, team: 'T' },
        { player_id: 4, name: 'P4', position: 'G', team_id: 1, team: 'T' },
      ];
      const formStats = [
        { playerId: 1, recentScores: '30', averageRecentPoints: 30, formScore: 30 },
        { playerId: 2, recentScores: '25', averageRecentPoints: 25, formScore: 25 },
        { playerId: 3, recentScores: '20', averageRecentPoints: 20, formScore: 20 },
        { playerId: 4, recentScores: '15', averageRecentPoints: 15, formScore: 15 },
      ];

      const result = mapCaptainRecommendations(candidates, formStats, 2);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.player_id)).toEqual([1, 2]);
    });
  });

  describe('mapManagerAlerts', () => {
    it('formats price gains, losses, and good performance', () => {
      const rawData = {
        priceGains: [
          { name: 'Gainer 1', price_increment: '1500000' },
          { name: 'Gainer 2', price_increment: 600000 },
        ],
        priceLosses: [{ name: 'Loser 1', price_increment: '-800000' }],
        goodForm: { name: 'Star Player', fantasy_points: 32 },
      };

      const alerts = mapManagerAlerts(rawData, 5);

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
    });

    it('slices to limit when total alerts exceed limit', () => {
      const rawData = {
        priceGains: [
          { name: 'G1', price_increment: 1000000 },
          { name: 'G2', price_increment: 900000 },
        ],
        priceLosses: [
          { name: 'L1', price_increment: -1000000 },
          { name: 'L2', price_increment: -900000 },
        ],
        goodForm: { name: 'S1', fantasy_points: 30 },
      };

      const alerts = mapManagerAlerts(rawData, 3);
      expect(alerts).toHaveLength(3);
    });
  });
});
