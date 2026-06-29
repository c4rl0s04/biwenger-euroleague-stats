import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSyncSeasonWritable } from '../season-guard';

describe('sync season guard', () => {
  afterEach(() => {
    delete process.env.SYNC_SEASON_ID;
    delete process.env.ALLOW_SYNC_ON_FROZEN_SEASON;
    vi.unstubAllEnvs();
  });

  it('requires SYNC_SEASON_ID', async () => {
    const db = { query: vi.fn() };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SYNC_SEASON_ID_REQUIRED',
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('rejects a frozen season by default', async () => {
    process.env.SYNC_SEASON_ID = '2025-26';
    const db = {
      query: vi.fn(async () => ({ rows: [{ id: '2025-26', status: 'frozen' }] })),
    };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SYNC_SEASON_NOT_WRITABLE',
    });
  });

  it('allows exactly the configured active season', async () => {
    process.env.SYNC_SEASON_ID = '2026-27';
    const db = {
      query: vi.fn(async () => ({ rows: [{ id: '2026-27', status: 'active' }] })),
    };

    await expect(assertSyncSeasonWritable(db as any)).resolves.toEqual({
      seasonId: '2026-27',
      status: 'active',
    });
  });

  it('requires explicit read-scope confirmation for future production seasons', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.SYNC_SEASON_ID = '2026-27';
    const db = {
      query: vi.fn(async () => ({ rows: [{ id: '2026-27', status: 'active' }] })),
    };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SEASON_AWARE_READS_NOT_CONFIRMED',
    });
  });
});
