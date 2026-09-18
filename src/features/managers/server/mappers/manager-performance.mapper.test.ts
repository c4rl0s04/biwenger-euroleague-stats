import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { mapManagerCaptainStats, mapManagerHomeAway } from './manager-performance.mapper';

describe('manager-performance mapper', () => {
  describe('mapManagerCaptainStats', () => {
    it('maps captain stats and parses numeric fields correctly', () => {
      const readRows = {
        overall: { total_rounds: '5', extra_points: '25', avg_points: '5.0' },
        mostUsed: [
          {
            player_id: 10,
            name: 'Star Captain',
            times_captain: '3',
            avg_as_captain: '7.5',
            total_as_captain: '22',
            secret_canary: 'leaked',
          } as any,
        ],
        best: { name: 'Star Captain', points: '12' },
        worst: { name: 'Sub Captain', points: '2' },
      };

      const result = mapManagerCaptainStats(readRows);
      expect(result).toEqual({
        total_rounds: 5,
        extra_points: 25,
        avg_points: 5.0,
        most_used: [
          {
            player_id: 10,
            name: 'Star Captain',
            times_captain: 3,
            avg_as_captain: 7.5,
            total_as_captain: 22,
          },
        ],
        best_round: { name: 'Star Captain', points: 12 },
        worst_round: { name: 'Sub Captain', points: 2 },
      });
      expect((result.most_used[0] as any).secret_canary).toBeUndefined();
    });

    it('handles undefined overall and best/worst rows gracefully', () => {
      const result = mapManagerCaptainStats({
        overall: undefined,
        mostUsed: [],
        best: undefined,
        worst: undefined,
      });

      expect(result).toEqual({
        total_rounds: 0,
        extra_points: 0,
        avg_points: 0,
        most_used: [],
        best_round: { name: '', points: 0 },
        worst_round: { name: '', points: 0 },
      });
    });

    it('preserves NaN behavior for SQL null fields in existing overall row', () => {
      const result = mapManagerCaptainStats({
        overall: { total_rounds: '0', extra_points: null, avg_points: null },
        mostUsed: [],
        best: undefined,
        worst: undefined,
      });

      expect(result.extra_points).toBeNaN();
      expect(result.avg_points).toBeNaN();
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        total_rounds: 0,
        extra_points: null,
        avg_points: null,
        most_used: [],
        best_round: { name: '', points: 0 },
        worst_round: { name: '', points: 0 },
      });
    });
  });

  describe('mapManagerHomeAway', () => {
    it('computes home/away stats and difference percentage', () => {
      const row = {
        total_home: '120',
        total_away: '80',
        games_home: '4',
        games_away: '4',
        synthetic_token: 'secret',
      } as any;

      const result = mapManagerHomeAway(row);
      expect(result).toEqual({
        total_home: 120,
        total_away: 80,
        avg_home: 30,
        avg_away: 20,
        difference_pct: 50,
      });
      expect((result as any).synthetic_token).toBeUndefined();
    });

    it('guards against division by zero when games are zero', () => {
      const row = {
        total_home: '0',
        total_away: '0',
        games_home: '0',
        games_away: '0',
      };

      const result = mapManagerHomeAway(row);
      expect(result).toEqual({
        total_home: 0,
        total_away: 0,
        avg_home: 0,
        avg_away: 0,
        difference_pct: 0,
      });
    });

    it('throws TypeError if row is undefined', () => {
      expect(() => mapManagerHomeAway(undefined)).toThrow(TypeError);
    });
  });
});
