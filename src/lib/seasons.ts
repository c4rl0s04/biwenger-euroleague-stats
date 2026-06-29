import { eq } from 'drizzle-orm';
import { db } from './db';
import { DEFAULT_SEASON_ID, seasons } from './db/schema';

export type SeasonStatus = 'active' | 'frozen' | 'archived';

export interface SeasonRecord {
  id: string;
  name: string;
  status: SeasonStatus;
  frozenAt: Date | null;
}

export class SeasonError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SeasonError';
    this.code = code;
  }
}

export function getDefaultSeasonId(): string {
  return process.env.DEFAULT_SEASON_ID || DEFAULT_SEASON_ID;
}

export async function getSeasonById(seasonId: string): Promise<SeasonRecord | null> {
  const row = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
    columns: {
      id: true,
      name: true,
      status: true,
      frozenAt: true,
    },
  });

  if (!row) return null;
  return row as SeasonRecord;
}

export async function getActiveSeasonId(): Promise<string> {
  const activeSeasons = await db.query.seasons.findMany({
    where: eq(seasons.status, 'active'),
    columns: { id: true },
  });

  if (activeSeasons.length !== 1) {
    throw new SeasonError(
      'ACTIVE_SEASON_NOT_UNIQUE',
      `Expected exactly one active season, found ${activeSeasons.length}.`
    );
  }

  return activeSeasons[0].id;
}

export async function assertWritableSeason(seasonId: string): Promise<SeasonRecord> {
  const season = await getSeasonById(seasonId);

  if (!season) {
    throw new SeasonError('SEASON_NOT_FOUND', `Season ${seasonId} does not exist.`);
  }

  if (season.status !== 'active') {
    throw new SeasonError(
      'SEASON_NOT_WRITABLE',
      `Season ${seasonId} is ${season.status}; refusing to write season data.`
    );
  }

  return season;
}
