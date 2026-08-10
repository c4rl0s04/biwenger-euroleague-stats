import type { Pool } from 'pg';
import { getSeasonConfig, validateSeasonConfig } from '../config';

export interface SyncSeasonContext {
  seasonId: string;
  status: string;
  sourceLeagueId: string;
}

export class SyncSeasonGuardError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SyncSeasonGuardError';
    this.code = code;
  }
}

function shouldAllowFrozenOverride(): boolean {
  return (
    process.env.ALLOW_SYNC_ON_FROZEN_SEASON === 'true' && process.env.NODE_ENV !== 'production'
  );
}

export async function assertSyncSeasonWritable(db: Pool): Promise<SyncSeasonContext> {
  const configuredSeason = getSeasonConfig();
  try {
    validateSeasonConfig();
  } catch (error) {
    throw new SyncSeasonGuardError(
      'INVALID_SEASON_CONFIG',
      error instanceof Error ? error.message : 'Invalid season configuration.'
    );
  }
  const seasonId = configuredSeason.ID;

  const result = await db.query<{ id: string; status: string; source_league_id: string | null }>(
    'SELECT id, status, source_league_id FROM seasons WHERE id = $1',
    [seasonId]
  );
  const season = result.rows[0];

  if (!season) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_FOUND',
      `SEASON_ID=${seasonId} does not exist in seasons.`
    );
  }

  if (season.status !== 'active' && !shouldAllowFrozenOverride()) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_WRITABLE',
      `SEASON_ID=${seasonId} is ${season.status}; refusing to sync into a non-active season.`
    );
  }

  if (!season.source_league_id) {
    throw new SyncSeasonGuardError(
      'SEASON_SOURCE_LEAGUE_MISSING',
      `Season ${seasonId} has no source_league_id; refusing to sync without a database/provider binding.`
    );
  }

  if (season.source_league_id !== configuredSeason.BIWENGER_LEAGUE_ID) {
    throw new SyncSeasonGuardError(
      'SEASON_SOURCE_LEAGUE_MISMATCH',
      `Season ${seasonId} expects Biwenger league ${season.source_league_id}, but configuration targets ${configuredSeason.BIWENGER_LEAGUE_ID}.`
    );
  }

  if (
    process.env.SEASON_AWARE_READS_CONFIRMED !== 'true' &&
    process.env.NODE_ENV === 'production'
  ) {
    throw new SyncSeasonGuardError(
      'SEASON_AWARE_READS_NOT_CONFIRMED',
      'Refusing future-season sync in production until season-aware API reads are confirmed.'
    );
  }

  return {
    seasonId: season.id,
    status: season.status,
    sourceLeagueId: season.source_league_id,
  };
}
