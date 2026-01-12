import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPlayers } from '../steps/01-players.js';
import * as client from '../../api/biwenger-client.js';
import { CONFIG } from '../../config.js';

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
  });
});
