import { describe, expect, it, vi } from 'vitest';
import {
  closestOfficialGame,
  roundNumber,
  syncBiwengerMatches,
  type OfficialMatchRow,
} from '../matches';

describe('Biwenger Matches Service', () => {
  describe('roundNumber helper', () => {
    it('extracts number from Jornada and Round formats', () => {
      expect(roundNumber('Jornada 5')).toBe(5);
      expect(roundNumber('Round 12')).toBe(12);
      expect(roundNumber('Jornada 34 (aplazada)')).toBe(34);
    });

    it('returns null for non-numbered rounds', () => {
      expect(roundNumber('Final Four')).toBeNull();
      expect(roundNumber('Eliminatoria')).toBeNull();
    });
  });

  describe('closestOfficialGame', () => {
    it('returns null when candidates list is empty', () => {
      expect(closestOfficialGame([], 1, null)).toBeNull();
    });

    it('prioritizes candidate with matching round number', () => {
      const candidateRound1: OfficialMatchRow = {
        game_code: 10,
        round_number: 1,
        scheduled_at: new Date('2025-10-01T18:00:00Z'),
        status: 'finished',
        home_team_code: 'MAD',
        away_team_code: 'BAR',
        home_score: 80,
        away_score: 75,
        home_score_regtime: null,
        away_score_regtime: null,
        home_q1: null,
        away_q1: null,
        home_q2: null,
        away_q2: null,
        home_q3: null,
        away_q3: null,
        home_q4: null,
        away_q4: null,
        home_ot: null,
        away_ot: null,
        arena_code: null,
        arena_name: null,
        arena_capacity: null,
      };

      const candidateRound2: OfficialMatchRow = {
        ...candidateRound1,
        game_code: 20,
        round_number: 2,
      };

      const result = closestOfficialGame([candidateRound2, candidateRound1], 1, null);
      expect(result?.game_code).toBe(10);
    });

    it('ranks by scheduled timestamp closeness if round numbers match or are null', () => {
      const candidateA: OfficialMatchRow = {
        game_code: 1,
        round_number: 5,
        scheduled_at: new Date('2025-10-05T18:00:00Z'),
        status: 'finished',
        home_team_code: 'MAD',
        away_team_code: 'BAR',
        home_score: 80,
        away_score: 75,
        home_score_regtime: null,
        away_score_regtime: null,
        home_q1: null,
        away_q1: null,
        home_q2: null,
        away_q2: null,
        home_q3: null,
        away_q3: null,
        home_q4: null,
        away_q4: null,
        home_ot: null,
        away_ot: null,
        arena_code: null,
        arena_name: null,
        arena_capacity: null,
      };

      const candidateB: OfficialMatchRow = {
        ...candidateA,
        game_code: 2,
        scheduled_at: new Date('2025-10-10T18:00:00Z'),
      };

      // Biwenger date in unix epoch seconds close to candidate B: 2025-10-10T17:50:00Z
      const biwengerDateSec = new Date('2025-10-10T17:50:00Z').getTime() / 1000;
      const result = closestOfficialGame([candidateA, candidateB], 5, biwengerDateSec);
      expect(result?.game_code).toBe(2);
    });
  });

  describe('syncBiwengerMatches orchestration', () => {
    it('throws when seasonId is missing', async () => {
      const manager: any = {
        context: { db: {} },
        log: vi.fn(),
      };

      await expect(syncBiwengerMatches(manager, { id: 1, name: 'Jornada 1' })).rejects.toThrow(
        'The writable season was not resolved.'
      );
    });

    it('matches Biwenger games to official games and persists match records', async () => {
      const mockUpsertMatch = vi.fn().mockResolvedValue(undefined);
      const mockMutations: any = {
        upsertMatch: mockUpsertMatch,
      };

      const manager: any = {
        context: { db: {}, seasonId: '2025-26', season: { euroleagueCode: 'E2025' } },
        log: vi.fn(),
        resolveRoundId: vi.fn((r) => r.id),
      };

      const mockFetchRoundGames = vi.fn().mockResolvedValue({
        data: {
          games: [
            {
              id: 1001,
              home: { id: 1 },
              away: { id: 2 },
              date: 1759685765,
            },
          ],
        },
      });

      const mockGetOfficialTeamMappings = vi.fn().mockResolvedValue([
        { teamId: 1, providerTeamCode: 'MAD' },
        { teamId: 2, providerTeamCode: 'BAR' },
      ]);

      const mockGetSchedule = vi.fn().mockResolvedValue([
        {
          gameCode: 55,
          roundNumber: 1,
          scheduledAt: new Date(1759685765000),
          isPlayed: true,
          homeTeamCode: 'MAD',
          awayTeamCode: 'BAR',
        },
      ]);

      const result = await syncBiwengerMatches(
        manager,
        { id: 1, name: 'Jornada 1' },
        {},
        {
          fetchRoundGames: mockFetchRoundGames,
          getOfficialTeamMappings: mockGetOfficialTeamMappings,
          getSchedule: mockGetSchedule,
          prepareMutations: () => mockMutations,
        }
      );

      expect(mockUpsertMatch).toHaveBeenCalledTimes(1);
      expect(mockUpsertMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          round_id: 1,
          round_name: 'Jornada 1',
          home_id: 1,
          away_id: 2,
          official_game_code: 55,
          status: 'finished',
        })
      );
      expect(result.synced).toBe(1);
      expect(result.games).toBe(1);
    });

    it('throws error when a Biwenger game cannot be linked to an official game', async () => {
      const mockMutations: any = {
        upsertMatch: vi.fn(),
      };

      const manager: any = {
        context: { db: {}, seasonId: '2025-26', season: { euroleagueCode: 'E2025' } },
        log: vi.fn(),
        resolveRoundId: vi.fn((r) => r.id),
      };

      const mockFetchRoundGames = vi.fn().mockResolvedValue({
        data: {
          games: [
            {
              id: 1001,
              home: { id: 1 },
              away: { id: 2 },
            },
          ],
        },
      });

      // Mappings exist, but official schedule has NO games between MAD and BAR
      const mockGetOfficialTeamMappings = vi.fn().mockResolvedValue([
        { teamId: 1, providerTeamCode: 'MAD' },
        { teamId: 2, providerTeamCode: 'BAR' },
      ]);

      const mockGetSchedule = vi.fn().mockResolvedValue([]);

      await expect(
        syncBiwengerMatches(
          manager,
          { id: 1, name: 'Jornada 1' },
          {},
          {
            fetchRoundGames: mockFetchRoundGames,
            getOfficialTeamMappings: mockGetOfficialTeamMappings,
            getSchedule: mockGetSchedule,
            prepareMutations: () => mockMutations,
          }
        )
      ).rejects.toThrow('1 Biwenger matches could not be linked to official games.');
    });

    it('rejects when a team appears in multiple matches within the same round', async () => {
      const mockMutations: any = {
        upsertMatch: vi.fn(),
      };

      const manager: any = {
        context: { db: {}, seasonId: '2025-26', season: { euroleagueCode: 'E2025' } },
        log: vi.fn(),
        resolveRoundId: vi.fn((r) => r.id),
      };

      // Team 1 appears in both Match 1 (home) and Match 2 (away) in Round 1
      const mockFetchRoundGames = vi.fn().mockResolvedValue({
        data: {
          games: [
            { id: 1001, home: { id: 1 }, away: { id: 2 } },
            { id: 1002, home: { id: 3 }, away: { id: 1 } },
          ],
        },
      });

      const mockGetOfficialTeamMappings = vi.fn().mockResolvedValue([
        { teamId: 1, providerTeamCode: 'MAD' },
        { teamId: 2, providerTeamCode: 'BAR' },
        { teamId: 3, providerTeamCode: 'OLY' },
      ]);

      await expect(
        syncBiwengerMatches(
          manager,
          { id: 1, name: 'Jornada 1' },
          {},
          {
            fetchRoundGames: mockFetchRoundGames,
            getOfficialTeamMappings: mockGetOfficialTeamMappings,
            getSchedule: vi.fn().mockResolvedValue([]),
            prepareMutations: () => mockMutations,
          }
        )
      ).rejects.toThrow(
        /Invariant violation: Team 1 appears in multiple matches for round Jornada 1/
      );
    });
  });
});
