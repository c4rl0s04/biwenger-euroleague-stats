import { db as pgClient } from './client';
import { CONFIG } from '../config';
import { cookies } from 'next/headers';
import { getActiveSeasonId } from '../seasons';

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

async function getCookieSeasonId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('NEXT_SEASON_ID')?.value?.trim();
    return cookieValue || null;
  } catch {
    // When called outside of a Next.js request context (e.g. scripts, background jobs), cookies() throws
    return null;
  }
}

export async function resolveReadSeasonId(requestedSeasonId?: string | null): Promise<string> {
  const explicitSeasonId = requestedSeasonId?.trim();
  if (explicitSeasonId) {
    return assertSeasonExists(explicitSeasonId);
  }

  const cookieSeasonId = await getCookieSeasonId();
  if (cookieSeasonId) {
    return assertSeasonExists(cookieSeasonId);
  }

  if (!CONFIG.DB.SKIP) {
    try {
      const activeId = await getActiveSeasonId();
      if (activeId) return activeId;
    } catch {
      // Fallback to CONFIG.SEASON.ID if DB query fails
    }
  }

  return assertSeasonExists(CONFIG.SEASON.ID);
}
