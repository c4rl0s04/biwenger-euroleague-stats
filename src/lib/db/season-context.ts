import { db as pgClient } from './client';
import { DEFAULT_SEASON_ID } from './schema';

export class ReadSeasonError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReadSeasonError';
    this.code = code;
  }
}

async function assertSeasonExists(seasonId: string): Promise<string> {
  const res = await (pgClient as any).query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
  if (res.rows.length === 0) {
    throw new ReadSeasonError('SEASON_NOT_FOUND', `Season ${seasonId} does not exist.`);
  }
  return seasonId;
}

export async function resolveReadSeasonId(requestedSeasonId?: string | null): Promise<string> {
  const explicitSeasonId = requestedSeasonId?.trim();
  if (explicitSeasonId) {
    return assertSeasonExists(explicitSeasonId);
  }

  const envSeasonId = process.env.READ_SEASON_ID || process.env.DEFAULT_SEASON_ID;
  if (envSeasonId) {
    return assertSeasonExists(envSeasonId);
  }

  const active = await (pgClient as any).query(
    "SELECT id FROM seasons WHERE status = 'active' ORDER BY id"
  );

  if (active.rows.length === 1) {
    return active.rows[0].id;
  }

  if (active.rows.length > 1) {
    throw new ReadSeasonError(
      'ACTIVE_SEASON_NOT_UNIQUE',
      `Expected at most one active season, found ${active.rows.length}.`
    );
  }

  return DEFAULT_SEASON_ID;
}
