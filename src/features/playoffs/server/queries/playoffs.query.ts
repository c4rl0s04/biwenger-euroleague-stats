import 'server-only';
import { db } from '@/lib/db/client';
import { playoffPredictions, playoffResults, userPlayoffMedia, userSeasons } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { PlayoffFacts } from './playoff.records';

export async function readPlayoffFacts(): Promise<PlayoffFacts> {
  const seasonId = await resolveReadSeasonId();
  const allUsers = await db
    .select({
      id: userSeasons.userId,
      name: userSeasons.name,
      icon: userSeasons.icon,
      colorIndex: userSeasons.colorIndex,
    })
    .from(userSeasons)
    .where(and(eq(userSeasons.seasonId, seasonId), ne(userSeasons.status, 'inactive')));
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
