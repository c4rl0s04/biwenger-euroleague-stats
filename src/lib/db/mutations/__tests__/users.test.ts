import { describe, expect, it, vi } from 'vitest';
import { prepareUserMutations } from '../users';

function createMockDb(rows: any[] = []) {
  return {
    query: vi.fn(async (_sql: string, _params?: any[]) => ({ rows, rowCount: rows.length })),
  };
}

describe('user mutations season isolation', () => {
  it('loads active users from the configured season state', async () => {
    const db = createMockDb([{ id: 'u1', name: 'Manager', icon: null, color_index: 2 }]);
    const mutations = prepareUserMutations(db as any, { seasonId: '2026-27' });

    const result = await mutations.getAllUsers();

    expect(result.all()).toEqual([{ id: 'u1', name: 'Manager', icon: null, color_index: 2 }]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM user_seasons us'), [
      '2026-27',
    ]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("COALESCE(us.status, 'active') = 'active'"),
      ['2026-27']
    );
  });

  it('marks stale users inactive only inside the configured season', async () => {
    const db = createMockDb();
    const mutations = prepareUserMutations(db as any, { seasonId: '2026-27' });

    await mutations.markSeasonUsersInactiveExcept(['u1', 'u2']);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE season_id = $1'), [
      '2026-27',
      ['u1', 'u2'],
    ]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ANY($2::text[])'), [
      '2026-27',
      ['u1', 'u2'],
    ]);
  });

  it('rejects an empty active member list without writing', async () => {
    const db = createMockDb();
    const mutations = prepareUserMutations(db, { seasonId: '2026-27' });

    await expect(mutations.markSeasonUsersInactiveExcept([])).rejects.toThrow(
      'Cannot deactivate users without active members.'
    );
    expect(db.query).not.toHaveBeenCalled();
  });

  it('replaces ownership for the selected season in one query', async () => {
    const db = createMockDb();
    const mutations = prepareUserMutations(db, { seasonId: '2026-27' });
    const ownership = [{ player_id: 101, owner_id: 'u1' }];

    await mutations.replaceSeasonOwnership(ownership);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE player_seasons'), [
      '2026-27',
      JSON.stringify(ownership),
    ]);
    const [sql] = db.query.mock.calls[0];
    expect(sql).toContain('WHERE existing.season_id = $1');
    expect(sql).toContain('NOT EXISTS');
    expect(sql).not.toContain('UPDATE players');
  });
});
