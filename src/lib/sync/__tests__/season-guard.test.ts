import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSyncSeasonWritable } from '../season-guard';
const row = {
  id: '2026-27',
  status: 'active',
  is_sync_enabled: true,
  source_league_id: '456',
  euroleague_code: 'E2026',
  starts_at: '2026-09-01',
};
const database = (rows = [row]) => ({ query: vi.fn(async () => ({ rows })) });
afterEach(() => vi.unstubAllEnvs());

describe('database-owned writable sync season', () => {
  it('uses active database metadata, ignoring obsolete environment metadata', async () => {
    vi.stubEnv('SEASON_ID', '1999-00');
    vi.stubEnv('BIWENGER_LEAGUE_ID', '999');
    vi.stubEnv('NODE_ENV', 'production');
    const db = database();
    await expect(assertSyncSeasonWritable(db)).resolves.toEqual({
      seasonId: row.id,
      status: 'active',
      sourceLeagueId: '456',
      euroleagueCode: 'E2026',
      startsAt: row.starts_at,
    });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("status = 'active'"));
  });
  it('uses an explicit target without changing it to the active season', async () => {
    const db = database();
    await assertSyncSeasonWritable(db, '2026-27');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('id = $1'), ['2026-27']);
  });
  it.each([{ rows: [] }, { rows: [row, row] }])(
    'rejects zero or multiple active seasons',
    async ({ rows }) => {
      await expect(assertSyncSeasonWritable(database(rows))).rejects.toMatchObject({
        code: 'SYNC_SEASON_NOT_FOUND',
      });
    }
  );
  it.each([{ status: 'frozen' }, { is_sync_enabled: false }])(
    'rejects unwritable season %j',
    async (change) => {
      await expect(
        assertSyncSeasonWritable(database([{ ...row, ...change }]))
      ).rejects.toMatchObject({ code: 'SYNC_SEASON_NOT_WRITABLE' });
    }
  );
  it.each([{ source_league_id: '' }, { euroleague_code: 'E2025' }, { starts_at: '' }])(
    'rejects incomplete provider binding %j',
    async (change) => {
      await expect(assertSyncSeasonWritable(database([{ ...row, ...change }]))).rejects.toThrow();
    }
  );
  it('does not let the diagnostic override unlock frozen production data', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_SYNC_ON_FROZEN_SEASON', 'true');
    await expect(
      assertSyncSeasonWritable(database([{ ...row, status: 'frozen' }]))
    ).rejects.toMatchObject({ code: 'SYNC_SEASON_NOT_WRITABLE' });
  });
});
