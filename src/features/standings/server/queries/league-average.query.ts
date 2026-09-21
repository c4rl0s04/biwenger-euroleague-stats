import 'server-only';
import { db } from '@/lib/db/client';
import { userRounds } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { sql } from 'drizzle-orm';

export async function queryLeagueAverage(): Promise<number | null> {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute<{ avg_points: number | null }>(sql`
    SELECT ROUND(AVG(points), 1)::float as avg_points
    FROM ${userRounds}
    WHERE season_id = ${seasonId}
      AND participated = TRUE
  `);
  return result.rows[0] ? result.rows[0].avg_points : 0;
}
