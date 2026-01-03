import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMatches } from '../sync-matches.js';
import * as euroleagueClient from '../../api/euroleague-client.js';

// Mock euroleague-client (syncMatches now uses fetchGameHeader, not fetchRoundGames)
vi.mock('../../api/euroleague-client.js', () => ({
  fetchGameHeader: vi.fn(),
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
    // Mock API response for fetchGameHeader
    euroleagueClient.fetchGameHeader.mockResolvedValue({
      Round: '1',
      CodeTeamA: 'IST',
      CodeTeamB: 'TEL',
      TeamA: 'Anadolu Efes Istanbul',
      TeamB: 'Maccabi Rapyd Tel Aviv',
      ScoreA: '85',
      ScoreB: '78',
      Date: '01/10/2025',
      Hour: '20:00',
      Stadium: 'Test Arena',
    });

    const round = { id: 4746, name: 'Jornada 1', status: 'finished' };

    await syncMatches(db, round);

    // Verify fetchGameHeader was called for each game in the round
    expect(euroleagueClient.fetchGameHeader).toHaveBeenCalled();

    // Verify DB prepare was called
    expect(db.prepare).toHaveBeenCalled();
  });

  it('should handle games with no data gracefully', async () => {
    // Mock API returning null (game not played yet)
    euroleagueClient.fetchGameHeader.mockResolvedValue(null);

    const round = { id: 4771, name: 'Jornada 26', status: 'pending' };

    await syncMatches(db, round);

    // Should not throw, just log warnings
    expect(euroleagueClient.fetchGameHeader).toHaveBeenCalled();
  });
});
