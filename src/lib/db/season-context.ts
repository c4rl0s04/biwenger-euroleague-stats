import { db as pgClient } from './client';
import { CONFIG } from '../config';

export class ReadSeasonError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReadSeasonError';
    this.code = code;
  }
}

async function assertSeasonExists(seasonId: string): Promise<string> {
  if (CONFIG.DB.SKIP) return seasonId;

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

  return assertSeasonExists(CONFIG.SEASON.ID);
}
