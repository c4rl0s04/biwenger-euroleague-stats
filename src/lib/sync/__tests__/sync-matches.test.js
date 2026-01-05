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
    vi.clearAllMocks();

    runMock = vi.fn();
    prepareMock = vi.fn(() => ({
      run: runMock,
      all: vi.fn(() => []),
    }));
    transactionMock = vi.fn((cb) => cb);

    db = {
      prepare: prepareMock,
      transaction: transactionMock,
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
    expect(runMock).toHaveBeenCalledWith(
      expect.objectContaining({
        home_id: 10,
        away_id: 20,
        home_score: 85,
        away_score: 80,
        status: 'finished',
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    client.fetchRoundGames.mockRejectedValue(new Error('API Error'));

    const round = { id: 4746, name: 'Jornada 1' };
    await syncMatches(db, round);

    // Check that it didn't crash but likely logged error
    expect(runMock).not.toHaveBeenCalled();
  });
});
