import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPlayers } from '../sync-players.js';
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

    runMock = vi.fn();
    getMock = vi.fn(() => ({ last_date: null })); // Return null so all prices are considered new
    prepareMock = vi.fn(() => ({ run: runMock, get: getMock }));
    transactionMock = vi.fn((cb) => cb);

    db = {
      prepare: prepareMock,
      transaction: transactionMock,
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
    expect(db.prepare).toHaveBeenCalled();

    // Verify Player Insert
    expect(runMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        name: 'Campazzo',
        team_id: 5,
        position: 'Base',
        puntos: 150,
      })
    );
  });
});
