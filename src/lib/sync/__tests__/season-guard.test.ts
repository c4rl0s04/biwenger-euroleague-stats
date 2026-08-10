import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSyncSeasonWritable } from '../season-guard';

describe('sync season guard', () => {
  function configureSeason() {
    process.env.SEASON_ID = '2026-27';
    process.env.BIWENGER_TOKEN = 'token';
    process.env.BIWENGER_LEAGUE_ID = '456';
    process.env.BIWENGER_USER_ID = '789';
    process.env.EUROLEAGUE_SEASON_CODE = 'E2026';
    process.env.LEAGUE_START_DATE = '2026-09-01';
  }

  afterEach(() => {
    delete process.env.SEASON_ID;
    delete process.env.BIWENGER_TOKEN;
    delete process.env.BIWENGER_LEAGUE_ID;
    delete process.env.BIWENGER_USER_ID;
    delete process.env.EUROLEAGUE_SEASON_CODE;
    delete process.env.LEAGUE_START_DATE;
    delete process.env.SEASON_AWARE_READS_CONFIRMED;
    delete process.env.ALLOW_SYNC_ON_FROZEN_SEASON;
    vi.unstubAllEnvs();
  });

  it('requires complete canonical season configuration', async () => {
    const db = { query: vi.fn() };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'INVALID_SEASON_CONFIG',
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('rejects a frozen season by default', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [{ id: '2026-27', status: 'frozen', source_league_id: '456' }],
      })),
    };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SYNC_SEASON_NOT_WRITABLE',
    });
  });

  it('allows exactly the configured active season', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [{ id: '2026-27', status: 'active', source_league_id: '456' }],
      })),
    };

    await expect(assertSyncSeasonWritable(db as any)).resolves.toEqual({
      seasonId: '2026-27',
      status: 'active',
      sourceLeagueId: '456',
    });
  });

  it('rejects a configured league that does not match the season binding', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [{ id: '2026-27', status: 'active', source_league_id: 'old-league' }],
      })),
    };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SEASON_SOURCE_LEAGUE_MISMATCH',
    });
  });

  it('requires explicit read-scope confirmation for future production seasons', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [{ id: '2026-27', status: 'active', source_league_id: '456' }],
      })),
    };

    await expect(assertSyncSeasonWritable(db as any)).rejects.toMatchObject({
      code: 'SEASON_AWARE_READS_NOT_CONFIRMED',
    });
  });
});
