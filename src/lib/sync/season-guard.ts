import type { Pool } from 'pg';

export interface QueryableDb {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }>;
}
export type DbClient = Pool | QueryableDb;
export interface SyncSeasonContext {
  seasonId: string;
  status: string;
  sourceLeagueId: string;
  euroleagueCode: string;
  startsAt: string;
}
export class SyncSeasonGuardError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'SyncSeasonGuardError';
  }
}
export interface AssertSyncSeasonOptions {
  explicitSeasonId?: string;
}

export async function assertSyncSeasonWritable(
  db: DbClient,
  options?: string | AssertSyncSeasonOptions
): Promise<SyncSeasonContext> {
  const targetId = typeof options === 'string' ? options : options?.explicitSeasonId;
  const columns = 'id, status, is_sync_enabled, source_league_id, euroleague_code, starts_at';
  const result = targetId
    ? await db.query(`SELECT ${columns} FROM seasons WHERE id = $1`, [targetId])
    : await db.query(`SELECT ${columns} FROM seasons WHERE status = 'active'`);
  if (result.rows.length !== 1)
    throw new SyncSeasonGuardError('SYNC_SEASON_NOT_FOUND', 'Expected exactly one target season.');
  const season = result.rows[0];
  const allowFrozen =
    process.env.ALLOW_SYNC_ON_FROZEN_SEASON === 'true' && process.env.NODE_ENV !== 'production';
  if ((season.status !== 'active' || season.is_sync_enabled !== true) && !allowFrozen) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_WRITABLE',
      'Target season is not active and sync-enabled.'
    );
  }
  if (!/^[1-9]\d*$/.test(season.source_league_id ?? ''))
    throw new SyncSeasonGuardError(
      'SEASON_SOURCE_LEAGUE_MISSING',
      'Season requires a valid Biwenger league binding.'
    );
  if (!/^\d{4}-\d{2}$/.test(season.id) || season.euroleague_code !== `E${season.id.slice(0, 4)}`)
    throw new SyncSeasonGuardError(
      'SEASON_EUROLEAGUE_CODE_MISSING',
      'Season requires a matching official provider code.'
    );
  if (!season.starts_at || Number.isNaN(Date.parse(season.starts_at)))
    throw new SyncSeasonGuardError(
      'SEASON_START_DATE_MISSING',
      'Season requires a valid start date.'
    );
  return {
    seasonId: season.id,
    status: season.status,
    sourceLeagueId: season.source_league_id,
    euroleagueCode: season.euroleague_code,
    startsAt: season.starts_at,
  };
}
