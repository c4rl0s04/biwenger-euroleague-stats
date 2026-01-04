import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMatches } from '../sync-matches.js';
import * as euroleagueClient from '../../api/euroleague-client.js';

// Mock euroleague-client (syncMatches now uses fetchSchedule AND fetchGameHeader)
vi.mock('../../api/euroleague-client.js', () => ({
  fetchGameHeader: vi.fn(),
  fetchSchedule: vi.fn(),
}));

describe('syncMatches', () => {
  let db;
  let prepareMock;
  let runMock;
  let getMock;
  let allMock;
  let upsertMock;
  let transactionMock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Database
    runMock = vi.fn();
    upsertMock = vi.fn();
    getMock = vi.fn(() => ({ value: '20' })); // Default team count from sync_meta
    allMock = vi.fn(() => [
      // Mock teams with EuroLeague codes
      { id: 560, code: 'IST', name: 'Anadolu Efes Istanbul' },
      { id: 576, code: 'TEL', name: 'Maccabi Playtika Tel Aviv' },
    ]);
    prepareMock = vi.fn(() => ({
      run: runMock,
      get: getMock,
      all: allMock,
      upsertMatch: { run: upsertMock },
    }));
    transactionMock = vi.fn((cb) => cb);

    db = {
      prepare: prepareMock,
      transaction: transactionMock,
    };
  });

  it('should sync matches correctly when data is returned', async () => {
    // Mock Schedule
    euroleagueClient.fetchSchedule.mockResolvedValue({
      schedule: {
        item: [
          {
            gameday: 1,
            game: 1,
            gamecode: 'E2025_1',
            homecode: 'IST',
            awaycode: 'TEL',
            date: 'Oct 01, 2025',
            startime: '20:00',
            played: true,
          },
        ],
      },
    });

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
      GameTime: '40:00', // Finished
    });

    const round = { id: 4746, name: 'Jornada 1', status: 'finished' };

    await syncMatches(db, round);

    // Verify fetchSchedule was called
    expect(euroleagueClient.fetchSchedule).toHaveBeenCalled();

    // Verify fetchGameHeader was called for each game in the round
    expect(euroleagueClient.fetchGameHeader).toHaveBeenCalled();

    // Verify DB prepare was called
    expect(db.prepare).toHaveBeenCalled();
  });

  it('should handle games with no data gracefully', async () => {
    // Mock Schedule returning empty or future games
    euroleagueClient.fetchSchedule.mockResolvedValue({
      schedule: {
        item: [
          {
            gameday: 26,
            game: 200,
            gamecode: 'E2025_200',
            homecode: 'IST',
            awaycode: 'TEL',
            date: 'Mar 01, 2026',
            played: false,
          },
        ],
      },
    });

    // Mock API returning null (game not played yet)
    euroleagueClient.fetchGameHeader.mockResolvedValue(null);

    const round = { id: 4771, name: 'Jornada 26', status: 'pending' };

    await syncMatches(db, round);

    // Should fetch schedule
    expect(euroleagueClient.fetchSchedule).toHaveBeenCalled();
    // Should NOT fetch details for unplayed game
    expect(euroleagueClient.fetchGameHeader).not.toHaveBeenCalled();
  });
});
