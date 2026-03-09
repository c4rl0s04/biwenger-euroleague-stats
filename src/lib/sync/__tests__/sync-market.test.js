import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncBoard } from '../steps/07-market.js';
import * as client from '../../api/biwenger-client.js';

vi.mock('../../api/biwenger-client.js', () => ({
  biwengerFetch: vi.fn(),
}));

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

  beforeEach(() => {
    vi.clearAllMocks();

    db = {
      query: vi.fn(async (sql) => {
        if (sql.includes('SELECT name FROM users')) {
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

  it('inserts transfers even when the player is missing from playersList', async () => {
    client.biwengerFetch
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

    const result = await syncBoard(db, {}, {});

    expect(result.success).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fichajes'),
      expect.arrayContaining([1759685765, 'June', 'Mercado', 24806, 1872600])
    );
  });

  it('skips transfers involving actors outside users and market', async () => {
    client.biwengerFetch
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

    await syncBoard(db, {}, {});

    const insertCalls = db.query.mock.calls.filter(([sql]) => sql.includes('INSERT INTO fichajes'));
    expect(insertCalls).toHaveLength(0);
  });
});
