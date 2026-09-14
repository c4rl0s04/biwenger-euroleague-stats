import { describe, expect, it, vi } from 'vitest';
import { syncBiwengerSquads } from '../squads';

describe('Biwenger Squads Service', () => {
  it('returns early when no users are in the database', async () => {
    const mockDb = {
      query: vi.fn(async (sql) => {
        if (sql.includes('SELECT')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };

    const manager: any = {
      context: { db: mockDb, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const result = await syncBiwengerSquads(manager);
    expect(result.counts.users).toBe(0);
    expect(result.counts.playersOwned).toBe(0);
  });

  it('updates ownership for users and their players', async () => {
    const mockDb = {
      query: vi.fn(async (sql) => {
        if (sql.includes('SELECT')) {
          return { rows: [{ id: 'user-1', name: 'Alice' }] };
        }
        return { rows: [] };
      }),
    };

    const manager: any = {
      context: { db: mockDb, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      data: {
        players: [{ id: 101 }, { id: 102 }],
      },
    });

    const result = await syncBiwengerSquads(manager, { fetch: mockFetch });
    expect(result.counts.users).toBe(1);
    expect(result.counts.playersOwned).toBe(2);
    expect(mockFetch).toHaveBeenCalled();
  });
});
