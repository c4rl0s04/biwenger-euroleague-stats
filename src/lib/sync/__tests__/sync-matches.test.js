import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMatches } from '../sync-matches.js';
import * as euroleagueClient from '../../api/euroleague-client.js';

// Mock V3 euroleague-client functions
vi.mock('../../api/euroleague-client.js', () => ({
  fetchGameStats: vi.fn(),
  extractMatchInfo: vi.fn(),
}));

describe('syncMatches', () => {
  let db;
  let prepareMock;
  let runMock;
  let getMock;
  let allMock;
  let transactionMock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Database
    runMock = vi.fn();
    getMock = vi.fn(() => ({ value: '20' })); // Default team count from sync_meta
    allMock = vi.fn(() => [
      // Mock teams with EuroLeague codes
      { id: 560, code: 'IST', name: 'Anadolu Efes Istanbul' },
      { id: 576, code: 'TEL', name: 'Maccabi Playtika Tel Aviv' },
    ]);
    prepareMock = vi.fn(() => ({ run: runMock, get: getMock, all: allMock }));
    transactionMock = vi.fn((cb) => cb);

    db = {
      prepare: prepareMock,
      transaction: transactionMock,
    };
  });

  it('should sync matches correctly when data is returned', async () => {
    // Mock V3 API response
    const mockGameStats = {
      local: { players: [{ stats: { points: 20 } }] },
      road: { players: [] },
    };
    euroleagueClient.fetchGameStats.mockResolvedValue(mockGameStats);
    euroleagueClient.extractMatchInfo.mockReturnValue({
      homeTeam: 'Anadolu Efes Istanbul',
      homeCode: 'IST',
      awayTeam: 'Maccabi Rapyd Tel Aviv',
      awayCode: 'TEL',
      homeScore: 85,
      awayScore: 78,
      played: true,
    });

    const round = { id: 4746, name: 'Jornada 1', status: 'finished' };

    await syncMatches(db, round);

    // Verify fetchGameStats was called for each game in the round
    expect(euroleagueClient.fetchGameStats).toHaveBeenCalled();

    // Verify DB prepare was called
    expect(db.prepare).toHaveBeenCalled();
  });

  it('should handle games with no data gracefully', async () => {
    // Mock API returning null (game not played yet)
    euroleagueClient.fetchGameStats.mockResolvedValue(null);

    const round = { id: 4771, name: 'Jornada 26', status: 'pending' };

    await syncMatches(db, round);

    // Should not throw, just log warnings
    expect(euroleagueClient.fetchGameStats).toHaveBeenCalled();
  });
});
