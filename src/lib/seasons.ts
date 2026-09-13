import { desc, eq } from 'drizzle-orm';
import { CONFIG } from './config';
import { db } from './db/connection';
import { seasons } from './db/schema';

export type SeasonStatus = 'active' | 'frozen' | 'archived';

export interface SeasonRecord {
  id: string;
  name: string;
  status: SeasonStatus;
  isSyncEnabled: boolean;
  euroleagueCode: string | null;
  startsAt: string | null;
  endsAt: string | null;
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
  return CONFIG.SEASON.ID;
}

export async function getSeasonById(seasonId: string): Promise<SeasonRecord | null> {
  const row = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
    columns: {
      id: true,
      name: true,
      status: true,
      isSyncEnabled: true,
      euroleagueCode: true,
      startsAt: true,
      endsAt: true,
      frozenAt: true,
    },
  });

  if (!row) return null;
  return row as SeasonRecord;
}

export async function getActiveSeason(): Promise<SeasonRecord> {
  const activeSeasons = await db.query.seasons.findMany({
    where: eq(seasons.status, 'active'),
    columns: {
      id: true,
      name: true,
      status: true,
      isSyncEnabled: true,
      euroleagueCode: true,
      startsAt: true,
      endsAt: true,
      frozenAt: true,
    },
  });

  if (activeSeasons.length !== 1) {
    throw new SeasonError(
      'ACTIVE_SEASON_NOT_UNIQUE',
      `Expected exactly one active season, found ${activeSeasons.length}.`
    );
  }

  return activeSeasons[0] as SeasonRecord;
}

export async function getActiveSeasonId(): Promise<string> {
  const active = await getActiveSeason();
  return active.id;
}

export async function listAvailableSeasons(): Promise<SeasonRecord[]> {
  const rows = await db.query.seasons.findMany({
    orderBy: [desc(seasons.startsAt), desc(seasons.id)],
    columns: {
      id: true,
      name: true,
      status: true,
      isSyncEnabled: true,
      euroleagueCode: true,
      startsAt: true,
      endsAt: true,
      frozenAt: true,
    },
  });

  return rows as SeasonRecord[];
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
