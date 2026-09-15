import { describe, expect, it, vi } from 'vitest';
import {
  normalizeBiwengerPlayer,
  parseBiwengerDate,
  parsePriceDate,
  syncBiwengerCatalog,
} from '../catalog';

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

  describe('normalizeBiwengerPlayer', () => {
    const positionsMap = { 1: 'Base', 2: 'Alero', 3: 'Pívot' };

    it('normalizes valid player snapshot with complete fields', () => {
      const raw = {
        name: 'Facundo Campazzo',
        teamID: 1,
        position: 1,
        points: 120,
        pointsHome: 70,
        pointsAway: 50,
        playedHome: 5,
        playedAway: 4,
        pointsLastSeason: 200,
        status: 'injured',
        priceIncrement: 50000,
        price: 8000000,
        img: 'https://cdn.biwenger.com/players/101.png',
      };

      const snapshot = normalizeBiwengerPlayer('101', raw, positionsMap);
      expect(snapshot.id).toBe(101);
      expect(snapshot.name).toBe('Facundo Campazzo');
      expect(snapshot.teamId).toBe(1);
      expect(snapshot.position).toBe('Base');
      expect(snapshot.points).toBe(120);
      expect(snapshot.pointsHome).toBe(70);
      expect(snapshot.pointsAway).toBe(50);
      expect(snapshot.playedHome).toBe(5);
      expect(snapshot.playedAway).toBe(4);
      expect(snapshot.gamesPlayed).toBe(9);
      expect(snapshot.status).toBe('injured');
      expect(snapshot.price).toBe(8000000);
      expect(snapshot.img).toBe('https://cdn.biwenger.com/players/101.png');
    });

    it('preserves valid 0 scores, prices, and stats', () => {
      const raw = {
        name: 'Rookie Player',
        team_id: 2,
        points: 0,
        price: 0,
        playedHome: 0,
        playedAway: 0,
      };

      const snapshot = normalizeBiwengerPlayer(202, raw, positionsMap);
      expect(snapshot.id).toBe(202);
      expect(snapshot.points).toBe(0);
      expect(snapshot.price).toBe(0);
      expect(snapshot.playedHome).toBe(0);
      expect(snapshot.playedAway).toBe(0);
      expect(snapshot.gamesPlayed).toBe(0);
    });

    it('returns null for missing optional fields without fake defaults ("Unknown", "ok")', () => {
      const raw = {
        name: 'Unknown Status Player',
      };

      const snapshot = normalizeBiwengerPlayer(303, raw, positionsMap);
      expect(snapshot.id).toBe(303);
      expect(snapshot.position).toBeNull(); // NOT 'Unknown'
      expect(snapshot.status).toBeNull(); // NOT 'ok'
      expect(snapshot.points).toBeNull();
      expect(snapshot.teamId).toBeNull();
      expect(snapshot.gamesPlayed).toBeNull();
    });

    it('fails validation when id is missing or invalid', () => {
      expect(() => normalizeBiwengerPlayer('', { name: 'Test' })).toThrow('Invalid player id');
      expect(() => normalizeBiwengerPlayer(0, { name: 'Test' })).toThrow('Invalid player id');
      expect(() => normalizeBiwengerPlayer(-5, { name: 'Test' })).toThrow('Invalid player id');
      expect(() => normalizeBiwengerPlayer('abc', { name: 'Test' })).toThrow('Invalid player id');
    });

    it('fails validation when name is missing or blank', () => {
      expect(() => normalizeBiwengerPlayer(100, { name: '' })).toThrow(
        'Missing required player name'
      );
      expect(() => normalizeBiwengerPlayer(100, { name: '   ' })).toThrow(
        'Missing required player name'
      );
      expect(() => normalizeBiwengerPlayer(100, {})).toThrow('Missing required player name');
    });

    it('fails validation when payload is not an object', () => {
      expect(() => normalizeBiwengerPlayer(100, null)).toThrow('Invalid player raw payload');
      expect(() => normalizeBiwengerPlayer(100, undefined)).toThrow('Invalid player raw payload');
    });

    it('rejects malformed numeric values with validation error instead of treating as null', () => {
      const baseRaw = { name: 'Valid Player' };

      // Malformed points
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, points: 'foo' })).toThrow(
        'Malformed numeric value for points on player 101: "foo"'
      );

      // Malformed price
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, price: 'not-a-price' })).toThrow(
        'Malformed numeric value for price on player 101: "not-a-price"'
      );

      // Malformed playedHome
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, playedHome: 'abc' })).toThrow(
        'Malformed numeric value for playedHome on player 101: "abc"'
      );

      // Malformed teamID
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, teamID: 'invalid_team' })).toThrow(
        'Malformed numeric value for teamID on player 101: "invalid_team"'
      );

      // Malformed priceIncrement
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, priceIncrement: 'hundred' })).toThrow(
        'Malformed numeric value for priceIncrement on player 101: "hundred"'
      );

      // Non-finite number
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, price: NaN })).toThrow(
        'Malformed numeric value for price on player 101'
      );

      // Boolean instead of number
      expect(() => normalizeBiwengerPlayer(101, { ...baseRaw, points: true })).toThrow(
        'Malformed numeric value for points on player 101: true'
      );
    });

    it('parses valid numeric strings and distinguishes empty strings from malformed', () => {
      const snapshot = normalizeBiwengerPlayer(101, {
        name: 'Valid Player',
        points: '15',
        price: '5000000',
        playedHome: '0',
        playedAway: '',
        pointsHome: '   ',
        priceIncrement: null,
      });

      expect(snapshot.points).toBe(15);
      expect(snapshot.price).toBe(5000000);
      expect(snapshot.playedHome).toBe(0);
      expect(snapshot.playedAway).toBeNull();
      expect(snapshot.pointsHome).toBeNull();
      expect(snapshot.priceIncrement).toBeNull();
    });
  });
});
