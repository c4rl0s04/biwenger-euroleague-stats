import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSyncSeasonWritable } from '../season-guard';

describe('sync season guard', () => {
  function configureSeason() {
    process.env.BIWENGER_TOKEN = 'token';
    process.env.BIWENGER_USER_ID = '789';
    process.env.DATABASE_URL = 'postgres://localhost:5432/biwengerstats';
  }

  afterEach(() => {
    delete process.env.SEASON_ID;
    delete process.env.BIWENGER_TOKEN;
    delete process.env.BIWENGER_LEAGUE_ID;
    delete process.env.BIWENGER_USER_ID;
    delete process.env.EUROLEAGUE_SEASON_CODE;
    delete process.env.LEAGUE_START_DATE;
    delete process.env.DATABASE_URL;
    delete process.env.SEASON_AWARE_READS_CONFIRMED;
    delete process.env.ALLOW_SYNC_ON_FROZEN_SEASON;
    vi.unstubAllEnvs();
  });

  it('requires complete credentials and database configuration', async () => {
    const db = { query: vi.fn() };

    await expect(assertSyncSeasonWritable(db)).rejects.toMatchObject({
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

    await expect(assertSyncSeasonWritable(db)).rejects.toMatchObject({
      code: 'SYNC_SEASON_NOT_WRITABLE',
    });
  });

  it('allows active season resolved from database without SEASON_ID in env', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [
          { id: '2026-27', status: 'active', source_league_id: '456', euroleague_code: 'E2026' },
        ],
      })),
    };

    await expect(assertSyncSeasonWritable(db)).resolves.toEqual({
      seasonId: '2026-27',
      status: 'active',
      sourceLeagueId: '456',
      euroleagueCode: 'E2026',
    });
  });

  it('dynamically resolves active season when explicit season id is omitted', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [
          {
            id: '2026-27',
            status: 'active',
            is_sync_enabled: true,
            source_league_id: '456',
            euroleague_code: 'E2026',
          },
        ],
      })),
    };

    await expect(assertSyncSeasonWritable(db)).resolves.toEqual({
      seasonId: '2026-27',
      status: 'active',
      sourceLeagueId: '456',
      euroleagueCode: 'E2026',
    });
  });

  it('rejects a configured league that does not match the season binding', async () => {
    configureSeason();
    process.env.BIWENGER_LEAGUE_ID = '999';
    const db = {
      query: vi.fn(async () => ({
        rows: [{ id: '2026-27', status: 'active', source_league_id: '456' }],
      })),
    };

    await expect(assertSyncSeasonWritable(db)).rejects.toMatchObject({
      code: 'SEASON_SOURCE_LEAGUE_MISMATCH',
    });
  });

  it('requires explicit read-scope confirmation for future production seasons', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [
          { id: '2026-27', status: 'active', source_league_id: '456', euroleague_code: 'E2026' },
        ],
      })),
    };

    await expect(assertSyncSeasonWritable(db)).rejects.toMatchObject({
      code: 'SEASON_AWARE_READS_NOT_CONFIRMED',
    });
  });

  it('fails closed when a future season has no EuroLeague provider code', async () => {
    configureSeason();
    const db = {
      query: vi.fn(async () => ({
        rows: [
          {
            id: '2027-28',
            status: 'active',
            source_league_id: '456',
            is_sync_enabled: true,
            // euroleague_code is intentionally omitted/null
          },
        ],
      })),
    };

    await expect(assertSyncSeasonWritable(db)).rejects.toMatchObject({
      code: 'SEASON_EUROLEAGUE_CODE_MISSING',
    });
  });
});
