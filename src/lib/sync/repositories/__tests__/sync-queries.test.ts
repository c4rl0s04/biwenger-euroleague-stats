import { describe, expect, it, vi } from 'vitest';
import {
  getExistingPlayerIdentities,
  getExistingPlayerSeasonMap,
  getLiveRounds,
  getOfficialTeamMappings,
  getPlayerDirectoryMap,
  getRoundScheduleState,
  getSeasonActiveUserNames,
  hasActiveMatchesInWindow,
} from '../sync-queries';

describe('sync-queries repository', () => {
  describe('getExistingPlayerIdentities', () => {
    it('returns a Set of player IDs from query results', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([{ id: 101 }, { id: 102 }, { id: 103 }]),
        }),
      };

      const result = await getExistingPlayerIdentities(mockDb as any);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has(101)).toBe(true);
      expect(result.has(102)).toBe(true);
      expect(result.has(103)).toBe(true);
      expect(result.has(999)).toBe(false);
    });
  });

  describe('getPlayerDirectoryMap', () => {
    it('returns a dictionary keyed by player ID', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([
            { id: 1, name: 'Facundo Campazzo' },
            { id: 2, name: 'Walter Tavares' },
          ]),
        }),
      };

      const result = await getPlayerDirectoryMap(mockDb as any);
      expect(result).toEqual({
        1: { id: 1, name: 'Facundo Campazzo' },
        2: { id: 2, name: 'Walter Tavares' },
      });
    });
  });

  describe('getExistingPlayerSeasonMap', () => {
    it('returns a Map of player season records for the given season', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: 10, puntos: 150, pointsHome: 80, pointsAway: 70 },
              { id: 20, puntos: null, pointsHome: null, pointsAway: null },
            ]),
          }),
        }),
      };

      const result = await getExistingPlayerSeasonMap('2025-26', mockDb as any);
      expect(result).toBeInstanceOf(Map);
      expect(result.get(10)).toEqual({
        id: 10,
        puntos: 150,
        pointsHome: 80,
        pointsAway: 70,
      });
      // Nulls should fall back to 0
      expect(result.get(20)).toEqual({
        id: 20,
        puntos: 0,
        pointsHome: 0,
        pointsAway: 0,
      });
    });
  });

  describe('getSeasonActiveUserNames', () => {
    it('returns a Set of active user names filtering empty values', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                { name: 'Alice', status: 'active' },
                { name: 'Bob', status: 'active' },
                { name: '', status: 'active' },
                { name: null, status: 'active' },
              ]),
            }),
          }),
        }),
      };

      const result = await getSeasonActiveUserNames('2025-26', mockDb as any);
      expect(result).toBeInstanceOf(Set);
      expect(result.has('Alice')).toBe(true);
      expect(result.has('Bob')).toBe(true);
      expect(result.size).toBe(2);
    });
  });

  describe('getRoundScheduleState', () => {
    it('returns formatted schedule state when records exist', async () => {
      const lastDate = '2026-03-20T20:00:00.000Z';
      const firstDate = '2026-03-19T18:00:00.000Z';
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                lastMatchDate: lastDate,
                firstMatchDate: firstDate,
                allFinished: true,
                matchCount: 9,
                hasLineups: true,
              },
            ]),
          }),
        }),
      };

      const result = await getRoundScheduleState('2025-26', 1, true, mockDb as any);
      expect(result).toEqual({
        lastMatchDate: new Date(lastDate),
        firstMatchDate: new Date(firstDate),
        allFinished: true,
        matchCount: 9,
        hasLineups: true,
      });
    });

    it('returns defaults when no rows match', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      const result = await getRoundScheduleState('2025-26', 99, false, mockDb as any);
      expect(result).toEqual({
        lastMatchDate: null,
        firstMatchDate: null,
        allFinished: false,
        matchCount: 0,
        hasLineups: false,
      });
    });
  });

  describe('getLiveRounds', () => {
    it('returns formatted BiwengerRound array', async () => {
      const mockDb = {
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                { id: 25, name: 'Jornada 25' },
                { id: 26, name: null },
              ]),
            }),
          }),
        }),
      };

      const result = await getLiveRounds('2025-26', mockDb as any);
      expect(result).toEqual([
        { id: 25, name: 'Jornada 25', status: 'active' },
        { id: 26, name: 'Round 26', status: 'active' },
      ]);
    });
  });

  describe('hasActiveMatchesInWindow', () => {
    it('returns true when count > 0', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 3 }]),
          }),
        }),
      };

      const result = await hasActiveMatchesInWindow('2025-26', 15, mockDb as any);
      expect(result).toBe(true);
    });

    it('returns false when count is 0', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        }),
      };

      const result = await hasActiveMatchesInWindow('2025-26', 15, mockDb as any);
      expect(result).toBe(false);
    });
  });

  describe('getOfficialTeamMappings', () => {
    it('returns team mappings array', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { teamId: 10, providerTeamCode: 'RMB' },
              { teamId: 20, providerTeamCode: 'FCB' },
            ]),
          }),
        }),
      };

      const result = await getOfficialTeamMappings('2025-26', mockDb as any);
      expect(result).toEqual([
        { teamId: 10, providerTeamCode: 'RMB' },
        { teamId: 20, providerTeamCode: 'FCB' },
      ]);
    });
  });
});
