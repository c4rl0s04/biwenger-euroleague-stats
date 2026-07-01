import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run, syncPlayers } from '../steps/01-players.js';
import * as client from '../../api/biwenger-client.js';

// Mock biwenger-client
vi.mock('../../api/biwenger-client.js', () => ({
  fetchAllPlayers: vi.fn(),
  fetchPlayerDetails: vi.fn(),
}));

// Mock config
vi.mock('../../config.js', () => ({
  CONFIG: {
    POSITIONS: { 1: 'Base' },
  },
}));

describe('syncPlayers', () => {
  let db;
  let prepareMock;
  let runMock;
  let getMock;
  let transactionMock;

  beforeEach(() => {
    vi.clearAllMocks();

    db = {
      query: vi.fn(async (sql, params) => {
        // Mock existing players query
        if (sql === 'SELECT id FROM players') {
          return { rows: [] };
        }
        // Mock last price date check
        if (sql.includes('SELECT date FROM market_values')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 1 };
      }),
      connect: async () => ({
        query: vi.fn(),
        release: vi.fn(),
      }),
    };
  });

  it('should sync players correctly', async () => {
    const mockCompetition = {
      data: {
        data: {
          players: {
            101: {
              name: 'Campazzo',
              teamID: 5,
              position: 1,
              points: 150,
              price: 1000000,
            },
          },
          teams: {
            5: { name: 'Real Madrid' },
          },
        },
      },
    };

    const mockPlayerDetails = {
      data: {
        birthday: 19910223,
        height: 179,
        weight: 79,
        prices: [[251225, 1000000]], // Dec 25, 2025
      },
    };

    client.fetchAllPlayers.mockResolvedValue(mockCompetition);
    client.fetchPlayerDetails.mockResolvedValue(mockPlayerDetails);

    await syncPlayers(db);

    // Verify DB prepare was called (we don't check exact count as it depends on prepared statements bundle)
    // Verify DB query was called
    expect(db.query).toHaveBeenCalled();

    // Verify Player Insert
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO players'),
      expect.arrayContaining([101, 'Campazzo', 5, 'Base', 150])
    );

    const playerUpsertSql = db.query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO players')
    )?.[0];
    expect(playerUpsertSql).toContain('price = excluded.price');
    expect(playerUpsertSql).not.toContain('price = GREATEST(players.price, excluded.price)');
  });

  it('uses season-specific existing stats instead of global player stats', async () => {
    const mockCompetition = {
      data: {
        data: {
          players: {
            101: {
              name: 'Campazzo',
              teamID: 5,
              position: 1,
              points: 0,
              pointsHome: 0,
              pointsAway: 0,
              price: 1000000,
            },
          },
          teams: {
            5: { name: 'Real Madrid' },
          },
        },
      },
    };

    db.query.mockImplementation(async (sql, params) => {
      if (sql.includes('FROM player_seasons')) {
        expect(params).toEqual(['2026-27']);
        return {
          rows: [{ id: 101, puntos: 7, points_home: 4, points_away: 3 }],
          rowCount: 1,
        };
      }
      if (sql === 'SELECT id FROM players') {
        return { rows: [{ id: 101 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });

    client.fetchAllPlayers.mockResolvedValue(mockCompetition);

    await run({
      context: {
        db,
        seasonId: '2026-27',
        playersList: {},
        teams: {},
      },
      roundNameMap: new Map(),
      normalizeRoundName: (name) => name,
      log: vi.fn(),
      error: vi.fn(),
    });

    const playerSeasonUpsert = db.query.mock.calls.find(
      ([sql, params]) => sql.includes('INSERT INTO player_seasons') && params?.[0] === '2026-27'
    );

    expect(playerSeasonUpsert?.[1]).toEqual(
      expect.arrayContaining(['2026-27', 101, 5, 7, 0, 0, 0, 4, 3])
    );
    expect(client.fetchPlayerDetails).not.toHaveBeenCalled();
  });
});
