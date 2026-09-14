import { describe, expect, it, vi } from 'vitest';
import { parseBiwengerDate, parsePriceDate, syncBiwengerCatalog } from '../catalog';

describe('Biwenger Catalog Service', () => {
  describe('date helpers', () => {
    it('parses valid biwenger date integers (YYYYMMDD)', () => {
      expect(parseBiwengerDate(19950412)).toBe('1995-04-12');
      expect(parseBiwengerDate('20010930')).toBe('2001-09-30');
      expect(parseBiwengerDate(null)).toBeNull();
      expect(parseBiwengerDate(12345)).toBeNull();
    });

    it('parses price date integers (YYMMDD) handling day/month transposition', () => {
      expect(parsePriceDate(260914)).toBe('2026-09-14');
      // If month > 12, swaps month and day: 262509 -> year 2026, month 09, day 25
      expect(parsePriceDate(262509)).toBe('2026-09-25');
    });
  });

  describe('syncBiwengerCatalog', () => {
    it('throws when seasonId is not resolved', async () => {
      const manager: any = {
        context: { db: {} },
      };
      await expect(syncBiwengerCatalog(manager)).rejects.toThrow(
        'Canonical sync season was not resolved before catalogue import.'
      );
    });

    it('synchronizes teams and players successfully with mocked dependencies', async () => {
      const mockSelect = {
        from: vi.fn().mockImplementation(() => {
          const promise: any = Promise.resolve([]);
          promise.where = vi.fn().mockResolvedValue([]);
          return promise;
        }),
      };
      const mockDb = {
        select: vi.fn().mockReturnValue(mockSelect),
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      const manager: any = {
        context: { db: mockDb, seasonId: '2025-26' },
        log: vi.fn(),
        setBiwengerCompetition: vi.fn((raw) => ({
          players: raw.data.players,
          teams: raw.data.teams,
          rounds: raw.data.rounds,
        })),
      };

      const mockDependencies = {
        fetchAllPlayers: vi.fn().mockResolvedValue({
          data: {
            players: {
              '101': {
                name: 'Facundo Campazzo',
                teamID: 1,
                position: 1,
                points: 15,
                price: 5000000,
                priceIncrement: 100000,
              },
            },
            teams: {
              '1': { name: 'Real Madrid', img: 'https://cdn.biwenger.com/teams/1.png' },
            },
            rounds: [{ id: 1, name: 'Jornada 1' }],
          },
        }),
        fetchRoundGames: vi.fn().mockResolvedValue({
          data: {
            games: [
              { id: 10, date: 1759685765 }, // 2025 date
            ],
          },
        }),
        fetchPlayerDetails: vi.fn().mockResolvedValue({
          data: {
            birthday: 19910323,
            height: 181,
            weight: 88,
            prices: [[250914, 5000000]],
          },
        }),
        sleep: vi.fn().mockResolvedValue(undefined),
      };

      // Mock queries
      const result = await syncBiwengerCatalog(manager, mockDependencies);

      expect(result.summary).toBe('Biwenger player and team catalogue synchronized.');
      expect(result.counts.players).toBe(1);
      expect(result.counts.teams).toBe(1);
      expect(mockDependencies.fetchAllPlayers).toHaveBeenCalled();
      expect(mockDependencies.fetchRoundGames).toHaveBeenCalledWith(1);
      expect(mockDependencies.fetchPlayerDetails).toHaveBeenCalledWith(101);
    });
  });
});
