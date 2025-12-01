import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPlayers } from '../sync-players.js';
import * as client from '../../biwenger-client.js';
import { CONFIG } from '../../config.js';

// Mock biwenger-client
vi.mock('../../biwenger-client.js', () => ({
  fetchAllPlayers: vi.fn(),
}));

// Mock config
vi.mock('../../config.js', () => ({
  CONFIG: {
    POSITIONS: { 1: 'Base' }
  }
}));

describe('syncPlayers', () => {
  let db;
  let prepareMock;
  let runMock;
  let transactionMock;

  beforeEach(() => {
    vi.clearAllMocks();

    runMock = vi.fn();
    prepareMock = vi.fn(() => ({ run: runMock }));
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
            '101': {
              name: 'Campazzo',
              teamID: 5,
              position: 1,
              points: 150,
              price: 1000000
            }
          },
          teams: {
            5: { name: 'Real Madrid' }
          }
        }
      }
    };
    client.fetchAllPlayers.mockResolvedValue(mockCompetition);

    await syncPlayers(db);

    // Verify DB calls
    // Expect 2 prepare calls (players + market_values)
    expect(db.prepare).toHaveBeenCalledTimes(2);
    
    // Verify Player Insert
    expect(runMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 101,
      name: 'Campazzo',
      team: 'Real Madrid',
      position: 'Base',
      puntos: 150
    }));

    // Verify Market Value Insert
    expect(runMock).toHaveBeenCalledWith(expect.objectContaining({
      player_id: 101,
      price: 1000000
    }));
  });
});
