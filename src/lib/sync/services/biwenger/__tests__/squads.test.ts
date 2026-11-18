import { describe, expect, it, vi } from 'vitest';
import type { SyncManager } from '../../../manager';
import { syncBiwengerSquads } from '../squads';

const users = [{ id: 'user-1' }, { id: 'user-2' }];

function setup(members = users) {
  const query = vi.fn().mockResolvedValueOnce({ rows: members }).mockResolvedValue({ rows: [] });
  const manager = {
    context: { db: { query }, seasonId: '2025-26' },
    log: vi.fn(),
  } as unknown as SyncManager;
  return { manager, query };
}

describe('Biwenger Squads Service', () => {
  it('keeps ownership intact when there are no active users', async () => {
    const { manager, query } = setup([]);
    const fetch = vi.fn();

    const result = await syncBiwengerSquads(manager, { fetch });

    expect(result.counts).toEqual({ users: 0, playersOwned: 0 });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['2025-26']);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('writes all assignments together after checking every squad', async () => {
    const { manager, query } = setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { players: [{ id: 101 }, { id: 101 }] } })
      .mockImplementationOnce(async () => {
        expect(query).toHaveBeenCalledTimes(1);
        return { data: { players: [{ id: 102 }] } };
      });

    const result = await syncBiwengerSquads(manager, { fetch });

    expect(result.counts).toEqual({ users: 2, playersOwned: 2 });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO player_seasons'), [
      '2025-26',
      JSON.stringify([
        { player_id: 101, owner_id: 'user-1' },
        { player_id: 102, owner_id: 'user-2' },
      ]),
    ]);
  });

  it('clears ownership when all fetched squads are explicitly empty', async () => {
    const { manager, query } = setup();
    const fetch = vi.fn().mockResolvedValue({ data: { players: [] } });

    const result = await syncBiwengerSquads(manager, { fetch });

    expect(result.counts).toEqual({ users: 2, playersOwned: 0 });
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('SET owner_id = NULL'), [
      '2025-26',
      '[]',
    ]);
  });

  it.each([
    ['a missing players list', { data: {} }],
    ['a malformed player', { data: { players: [{ id: null }] } }],
    ['a conflicting owner', { data: { players: [{ id: 101 }] } }],
  ])('keeps ownership intact after %s in the last squad', async (_case, payload) => {
    const { manager, query } = setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { players: [{ id: 101 }] } })
      .mockResolvedValueOnce(payload);

    await expect(syncBiwengerSquads(manager, { fetch })).rejects.toThrow(
      'Failed to synchronize squad for user user-2.'
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps ownership intact when the last request fails', async () => {
    const { manager, query } = setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { players: [{ id: 101 }] } })
      .mockRejectedValueOnce(new Error('Provider unavailable'));

    await expect(syncBiwengerSquads(manager, { fetch })).rejects.toMatchObject({
      cause: { message: 'Provider unavailable' },
    });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
