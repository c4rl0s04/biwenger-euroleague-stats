import type { Pool } from 'pg';
import { getSeasonConfig, validateSeasonConfig } from '../config';

export interface QueryableDb {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }>;
}

export type DbClient = Pool | QueryableDb;

export interface SyncSeasonContext {
  seasonId: string;
  status: string;
  sourceLeagueId: string;
  euroleagueCode: string;
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

export interface AssertSyncSeasonOptions {
  explicitSeasonId?: string;
  skipEnvValidation?: boolean;
}

export async function assertSyncSeasonWritable(
  db: DbClient,
  options?: string | AssertSyncSeasonOptions
): Promise<SyncSeasonContext> {
  const opts: AssertSyncSeasonOptions =
    typeof options === 'string' ? { explicitSeasonId: options } : options || {};
  const configuredSeason = getSeasonConfig();
  const targetId = opts.explicitSeasonId || process.env.SEASON_ID;

  if (!opts.skipEnvValidation) {
    try {
      validateSeasonConfig();
    } catch (error) {
      throw new SyncSeasonGuardError(
        'INVALID_SEASON_CONFIG',
        error instanceof Error ? error.message : 'Invalid season configuration.'
      );
    }
  }

  interface SeasonRow {
    id: string;
    status: string;
    is_sync_enabled: boolean | null;
    source_league_id: string | null;
    euroleague_code: string | null;
  }

  let season: SeasonRow | undefined;
  const client: QueryableDb = db;

  if (targetId) {
    const result = await client.query(
      'SELECT id, status, is_sync_enabled, source_league_id, euroleague_code FROM seasons WHERE id = $1',
      [targetId]
    );
    season = result.rows[0];
    if (!season) {
      throw new SyncSeasonGuardError(
        'SYNC_SEASON_NOT_FOUND',
        `SEASON_ID=${targetId} does not exist in seasons.`
      );
    }
  } else {
    const result = await client.query(
      "SELECT id, status, is_sync_enabled, source_league_id, euroleague_code FROM seasons WHERE status = 'active' LIMIT 1"
    );
    season = result.rows[0];
    if (!season) {
      throw new SyncSeasonGuardError(
        'SYNC_SEASON_NOT_FOUND',
        'No active season found in seasons table.'
      );
    }
  }

  if (season.status !== 'active' && !shouldAllowFrozenOverride()) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_WRITABLE',
      `SEASON_ID=${season.id} is ${season.status}; refusing to sync into a non-active season.`
    );
  }

  if (season.is_sync_enabled === false && !shouldAllowFrozenOverride()) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_WRITABLE',
      `Season ${season.id} has is_sync_enabled = false; refusing to sync.`
    );
  }

  if (!season.source_league_id) {
    throw new SyncSeasonGuardError(
      'SEASON_SOURCE_LEAGUE_MISSING',
      `Season ${season.id} has no source_league_id; refusing to sync without a database/provider binding.`
    );
  }

  const expectedLeagueId = configuredSeason.BIWENGER_LEAGUE_ID;
  if (expectedLeagueId && season.source_league_id !== expectedLeagueId) {
    throw new SyncSeasonGuardError(
      'SEASON_SOURCE_LEAGUE_MISMATCH',
      `Season ${season.id} expects Biwenger league ${season.source_league_id}, but configuration targets ${expectedLeagueId}.`
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

  const euroleagueCode =
    season.euroleague_code ||
    (season.id === configuredSeason.ID ? configuredSeason.EUROLEAGUE_CODE : null);

  if (!euroleagueCode) {
    throw new SyncSeasonGuardError(
      'SEASON_EUROLEAGUE_CODE_MISSING',
      `Season ${season.id} has no euroleague_code; refusing to sync without an official provider binding.`
    );
  }

  return {
    seasonId: season.id,
    status: season.status,
    sourceLeagueId: season.source_league_id,
    euroleagueCode,
  };
}
