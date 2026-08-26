import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run as syncMatches } from '../services/biwenger/matches.js';
import * as client from '../../api/biwenger-client.js';

// Mock biwenger-client
vi.mock('../../api/biwenger-client.js', () => ({
  biwengerFetch: vi.fn(),
  fetchAllPlayers: vi.fn(),
  fetchPlayerDetails: vi.fn(),
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
        if (sql.includes('official_team_mappings')) {
          return {
            rows: [
              { team_id: 10, provider_team_code: 'MAD' },
              { team_id: 20, provider_team_code: 'BAR' },
            ],
          };
        }
        if (sql.includes('FROM official_games')) {
          return {
            rows: [
              {
                game_code: 1,
                round_number: 1,
                scheduled_at: new Date('2026-09-30T18:30:00Z'),
                status: 'scheduled',
                home_team_code: 'MAD',
                away_team_code: 'BAR',
                home_score: null,
                away_score: null,
                home_score_regtime: null,
                away_score_regtime: null,
                home_q1: null,
                away_q1: null,
                home_q2: null,
                away_q2: null,
                home_q3: null,
                away_q3: null,
                home_q4: null,
                away_q4: null,
                home_ot: null,
                away_ot: null,
              },
            ],
          };
        }
        return { rows: [], rowCount: 1 };
      }),
      connect: async () => ({
        query: vi.fn(),
        release: vi.fn(),
      }),
    };
  });

  const manager = () => ({
    context: { db, seasonId: '2026-27' },
    resolveRoundId: (round) => round.dbId || round.id,
    log: vi.fn(),
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
    await syncMatches(manager(), round);

    // Verify fetchRoundGames was called
    expect(client.fetchRoundGames).toHaveBeenCalledWith(4746);

    // Sporting fields come from official_games, not the Biwenger score/date.
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO matches'),
      expect.arrayContaining(['2026-27', 4746, 'Jornada 1', 10, 20, 'scheduled'])
    );
    const insert = db.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO matches'));
    expect(insert[1]).not.toContain(85);
    expect(insert[1]).not.toContain(80);
  });

  it('fails fast when Biwenger cannot return the round games', async () => {
    client.fetchRoundGames.mockRejectedValue(new Error('API Error'));

    const round = { id: 4746, name: 'Jornada 1' };
    await expect(syncMatches(manager(), round)).rejects.toThrow(
      'Could not load fantasy and official match inputs'
    );

    expect(db.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO matches'));
  });
});
