import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let getSeasonConfig;
let validateSeasonConfig;

beforeEach(async () => {
  // CONFIG.DB.SKIP is captured at import time. Test validation against controlled
  // state without removing the verifier's database-disabled child environment.
  vi.resetModules();
  vi.stubEnv('SKIP_DB', 'false');
  ({ getSeasonConfig, validateSeasonConfig } = await import('../config'));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const validEnv = {
  SEASON_ID: '2026-27',
  SEASON_NAME: 'EuroLeague Fantasy 2026-27',
  BIWENGER_TOKEN: 'token',
  BIWENGER_LEAGUE_ID: '123',
  BIWENGER_USER_ID: '456',
  EUROLEAGUE_SEASON_CODE: 'E2026',
  LEAGUE_START_DATE: '2026-09-01',
};

describe('canonical season configuration', () => {
  it('resolves every provider value from one season object', () => {
    expect(getSeasonConfig(validEnv)).toEqual({
      ID: '2026-27',
      NAME: 'EuroLeague Fantasy 2026-27',
      BIWENGER_LEAGUE_ID: '123',
      BIWENGER_USER_ID: '456',
      EUROLEAGUE_CODE: 'E2026',
      START_DATE: '2026-09-01',
    });
  });

  it('requires credentials and database configuration', () => {
    expect(() => validateSeasonConfig({}, {})).toThrow(/BIWENGER_TOKEN is required/);
    expect(() =>
      validateSeasonConfig(
        {},
        { BIWENGER_TOKEN: 'token', DATABASE_URL: 'postgres://localhost:5432/db' }
      )
    ).toThrow(/BIWENGER_USER_ID is required/);
    expect(() =>
      validateSeasonConfig({}, { BIWENGER_TOKEN: 'token', BIWENGER_USER_ID: '123' })
    ).toThrow(/DATABASE_URL is required/);
  });

  it('succeeds with credentials and database without requiring season in env', () => {
    const credentialsEnv = {
      BIWENGER_TOKEN: 'token',
      BIWENGER_USER_ID: '456',
      DATABASE_URL: 'postgres://localhost:5432/db',
    };
    expect(() => validateSeasonConfig({}, credentialsEnv)).not.toThrow();
  });

  it('allows an explicit database skip without bypassing provider validation', () => {
    expect(() =>
      validateSeasonConfig(
        {},
        {
          BIWENGER_TOKEN: 'fixture-only',
          BIWENGER_USER_ID: '123',
          SKIP_DB: 'true',
        }
      )
    ).not.toThrow();
    expect(() => validateSeasonConfig({}, { SKIP_DB: 'true' })).toThrow(
      /BIWENGER_TOKEN is required/
    );
  });

  it('preserves the import-time skip used by verification even after the environment changes', async () => {
    vi.stubEnv('SKIP_DB', 'true');
    vi.resetModules();
    const { validateSeasonConfig: validateSkipped } = await import('../config');
    vi.stubEnv('SKIP_DB', 'false');
    expect(() =>
      validateSkipped(
        {},
        {
          BIWENGER_TOKEN: 'fixture-only',
          BIWENGER_USER_ID: '123',
          SKIP_DB: 'false',
        }
      )
    ).not.toThrow();
    // The independently imported non-skip validator still enforces the original assertion.
    expect(() =>
      validateSeasonConfig(
        {},
        {
          BIWENGER_TOKEN: 'fixture-only',
          BIWENGER_USER_ID: '123',
        }
      )
    ).toThrow(/DATABASE_URL is required/);
  });

  it('rejects stale or malformed optional season codes and dates if provided', () => {
    const baseEnv = {
      BIWENGER_TOKEN: 'token',
      BIWENGER_USER_ID: '456',
      DATABASE_URL: 'postgres://localhost:5432/db',
    };
    expect(() => validateSeasonConfig({}, { ...baseEnv, EUROLEAGUE_SEASON_CODE: '2025' })).toThrow(
      /EUROLEAGUE_SEASON_CODE must use EYYYY format/
    );

    expect(() => validateSeasonConfig({}, { ...baseEnv, SEASON_ID: '2026-2027' })).toThrow(
      /SEASON_ID must use YYYY-YY format/
    );

    expect(() => validateSeasonConfig({}, { ...baseEnv, LEAGUE_START_DATE: 'September' })).toThrow(
      /LEAGUE_START_DATE must use YYYY-MM-DD format/
    );
  });
});
