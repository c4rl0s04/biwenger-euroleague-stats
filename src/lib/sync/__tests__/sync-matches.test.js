import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMatches } from '../services/biwenger/matches.js';
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
    vi.clearAllMocks();

    db = {
      query: vi.fn(async (sql, params) => {
        // Mock getMappedTeams response
        if (sql.includes && sql.includes('SELECT id, code, name FROM teams')) {
          return { rows: [] };
        }
        return { rows: [], rowCount: 1 };
      }),
      connect: async () => ({
        query: vi.fn(),
        release: vi.fn(),
      }),
    };
  });

  it('should sync matches correctly when data is returned', async () => {
    const mockGamesData = {
      data: {
        games: [
          {
            id: 1,
            home: { id: 10, name: 'Real Madrid', score: 85 },
            away: { id: 20, name: 'Barcelona', score: 80 },
            status: 'finished',
            date: 1700000000,
          },
        ],
      },
    };

    client.fetchRoundGames.mockResolvedValue(mockGamesData);

    const round = { id: 4746, name: 'Jornada 1', dbId: 4746 };
    await syncMatches(db, round);

    // Verify fetchRoundGames was called
    expect(client.fetchRoundGames).toHaveBeenCalledWith(4746);

    // Verify Match Upsert
    // Verify Match Upsert (checking SQL text roughly)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO matches'),
      expect.arrayContaining([10, 20, 85, 80, 'finished'])
    );
  });

  it('should handle API errors gracefully', async () => {
    client.fetchRoundGames.mockRejectedValue(new Error('API Error'));

    const round = { id: 4746, name: 'Jornada 1' };
    await syncMatches(db, round);

    // Check that it didn't crash but likely logged error
    // Check that it didn't crash but likely logged error
    expect(db.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO matches'));
  });
});
