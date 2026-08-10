import { describe, expect, it } from 'vitest';
import { getSeasonConfig, validateSeasonConfig } from '../config';

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

  it('rejects incomplete configuration before a mutating sync', () => {
    expect(() => validateSeasonConfig({}, { SEASON_ID: '2026-27' })).toThrow(
      /BIWENGER_LEAGUE_ID is required/
    );
  });

  it('rejects stale or malformed season codes and dates', () => {
    expect(() =>
      validateSeasonConfig(
        {},
        { ...validEnv, EUROLEAGUE_SEASON_CODE: '2025', LEAGUE_START_DATE: 'September' }
      )
    ).toThrow(/EUROLEAGUE_SEASON_CODE must use EYYYY format/);
  });
});
