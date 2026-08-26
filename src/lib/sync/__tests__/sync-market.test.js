import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../steps/biwenger-board.js';

vi.mock('../../config.js', () => ({
  CONFIG: {
    API: {
      LEAGUE_ID: '12345',
    },
    ENDPOINTS: {
      BIWENGER: {
        LEAGUE_BOARD: vi.fn(
          (leagueId, offset, limit) => `/league/${leagueId}/board?offset=${offset}&limit=${limit}`
        ),
      },
    },
  },
}));

describe('syncBoard', () => {
  let db;
  let fetchBoard;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchBoard = vi.fn();

    db = {
      query: vi.fn(async (sql) => {
        if (sql.includes('FROM user_seasons us')) {
          return {
            rows: [{ name: 'June' }, { name: 'All Stars' }],
            rowCount: 2,
          };
        }

        if (sql.includes('INSERT INTO fichajes')) {
          return { rows: [{ id: 1 }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
    };
  });

  const manager = () => ({
    context: { db, seasonId: '2026-27' },
    mode: 'bootstrap',
    getBiwengerCompetition: vi.fn(async () => ({
      players: {},
      teams: { 1: { name: 'Real Madrid' } },
      rounds: [],
    })),
    resolveRoundId: (round) => round.id,
    log: vi.fn(),
  });

  it('inserts transfers even when the player is missing from playersList', async () => {
    fetchBoard
      .mockResolvedValueOnce({
        data: [
          {
            type: 'transfer',
            date: 1759685765,
            content: [
              {
                player: 24806,
                amount: 1872600,
                from: { name: 'June' },
                to: null,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const result = await run(manager(), { fetch: fetchBoard });

    expect(result.counts.transfers).toBe(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fichajes'),
      expect.arrayContaining([1759685765, 'June', 'Mercado', 24806, 1872600])
    );
  });

  it('skips transfers involving actors outside users and market', async () => {
    fetchBoard
      .mockResolvedValueOnce({
        data: [
          {
            type: 'transfer',
            date: 1759685765,
            content: [
              {
                player: 24806,
                amount: 1872600,
                from: { name: 'June' },
                to: { name: 'Real Madrid' },
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    await run(manager(), { fetch: fetchBoard });

    const insertCalls = db.query.mock.calls.filter(([sql]) => sql.includes('INSERT INTO fichajes'));
    expect(insertCalls).toHaveLength(0);
  });

  it('stores prediction pools in the same pass without changing ownership', async () => {
    fetchBoard
      .mockResolvedValueOnce({
        data: [
          {
            type: 'bettingPool',
            date: 1759685765,
            content: {
              pool: {
                round: { id: 7, name: 'Jornada 7' },
                responses: [{ id: 10, response: [80, 75], hits: 1 }],
              },
            },
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const result = await run(manager(), { fetch: fetchBoard });
    expect(result.counts.pools).toBe(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO porras'),
      expect.arrayContaining(['2026-27', '10', 7, '80-75'])
    );
    expect(db.query.mock.calls.map(([sql]) => sql).join('\n')).not.toContain('owner_id');
  });
});
