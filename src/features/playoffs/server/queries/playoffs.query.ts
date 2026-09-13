import 'server-only';
import { db } from '@/lib/db/connection';
import {
  playoffPredictions,
  playoffResults,
  userPlayoffMedia,
  users,
  userSeasons,
} from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { resolveReadSeasonId } from '@/lib/db/season-context';
export async function readPlayoffFacts() {
  const seasonId = await resolveReadSeasonId();
  const allUsers = await db
    .select({
      id: users.id,
      name: sql<string | null>`COALESCE(${userSeasons.name}, ${users.name})`,
      icon: sql<string | null>`COALESCE(${userSeasons.icon}, ${users.icon})`,
      colorIndex: sql<number>`COALESCE(${userSeasons.colorIndex}, ${users.colorIndex}, 0)`,
    })
    .from(users)
    .innerJoin(
      userSeasons,
      and(eq(userSeasons.userId, users.id), eq(userSeasons.seasonId, seasonId))
    )
    .where(sql`COALESCE(${userSeasons.status}, 'active') <> 'inactive'`);
  const predictions = await db
    .select()
    .from(playoffPredictions)
    .where(eq(playoffPredictions.seasonId, seasonId));
  const results = await db
    .select()
    .from(playoffResults)
    .where(eq(playoffResults.seasonId, seasonId));
  const media = await db
    .select()
    .from(userPlayoffMedia)
    .where(eq(userPlayoffMedia.seasonId, seasonId));

  return { allUsers, predictions, results, media };
}
