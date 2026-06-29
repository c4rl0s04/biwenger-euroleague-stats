import type { Pool } from 'pg';

export interface SyncSeasonContext {
  seasonId: string;
  status: string;
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
  const seasonId = process.env.SYNC_SEASON_ID;

  if (!seasonId) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_ID_REQUIRED',
      'SYNC_SEASON_ID is required for every mutating sync run.'
    );
  }

  const result = await db.query<{ id: string; status: string }>(
    'SELECT id, status FROM seasons WHERE id = $1',
    [seasonId]
  );
  const season = result.rows[0];

  if (!season) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_FOUND',
      `SYNC_SEASON_ID=${seasonId} does not exist in seasons.`
    );
  }

  if (season.status !== 'active' && !shouldAllowFrozenOverride()) {
    throw new SyncSeasonGuardError(
      'SYNC_SEASON_NOT_WRITABLE',
      `SYNC_SEASON_ID=${seasonId} is ${season.status}; refusing to sync into a non-active season.`
    );
  }

  if (
    season.id !== '2025-26' &&
    process.env.SEASON_AWARE_READS_CONFIRMED !== 'true' &&
    process.env.NODE_ENV === 'production'
  ) {
    throw new SyncSeasonGuardError(
      'SEASON_AWARE_READS_NOT_CONFIRMED',
      'Refusing future-season sync in production until season-aware API reads are confirmed.'
    );
  }

  return { seasonId: season.id, status: season.status };
}
