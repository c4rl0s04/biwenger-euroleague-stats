import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { matches } from '@/lib/db/schema';

export interface CalendarRow {
  id: number;
  date: Date | null;
  status: string | null;
  roundId: number | null;
  roundName: string | null;
}

export async function listCalendarRows(seasonId: string): Promise<CalendarRow[]> {
  return db
    .select({
      id: matches.id,
      date: matches.date,
      status: matches.status,
      roundId: matches.roundId,
      roundName: matches.roundName,
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .orderBy(asc(matches.date), asc(matches.id));
}
