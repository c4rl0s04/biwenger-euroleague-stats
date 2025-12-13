import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMatches } from '../sync-matches.js';
import * as client from '../../api/biwenger-client.js';

// Mock biwenger-client
vi.mock('../../api/biwenger-client.js', () => ({
  fetchRoundGames: vi.fn(),
}));

describe('syncMatches', () => {
  let db;
  let prepareMock;
  let runMock;
  let transactionMock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Database
    runMock = vi.fn();
    prepareMock = vi.fn(() => ({ run: runMock }));
    transactionMock = vi.fn((cb) => cb); // Execute callback immediately

    db = {
      prepare: prepareMock,
      transaction: transactionMock,
    };
  });

  it('should sync matches correctly when data is returned', async () => {
    // Mock API response
    const mockGamesData = {
      data: {
        games: [
          {
            home: { name: 'Real Madrid', score: 80 },
            away: { name: 'Barcelona', score: 75 },
            date: 1700000000,
            status: 'finished'
          }
        ]
      }
    };
    client.fetchRoundGames.mockResolvedValue(mockGamesData);

    const round = { id: 123, name: 'Jornada 1', status: 'finished' };

    await syncMatches(db, round);

    // Verify API call
    expect(client.fetchRoundGames).toHaveBeenCalledWith(123);

    // Verify DB calls
    expect(db.prepare).toHaveBeenCalled(); // Should prepare INSERT statement
    expect(db.transaction).toHaveBeenCalled();
    expect(runMock).toHaveBeenCalledWith({
      round_id: 123,
      round_name: 'Jornada 1',
      home_team: 'Real Madrid',
      away_team: 'Barcelona',
      date: new Date(1700000000 * 1000).toISOString(),
      status: 'finished',
      home_score: 80,
      away_score: 75
    });
  });

  it('should handle API errors gracefully', async () => {
    client.fetchRoundGames.mockRejectedValue(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const round = { id: 123, name: 'Jornada 1' };
    await syncMatches(db, round);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching games'));
    expect(runMock).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
