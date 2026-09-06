import 'server-only';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { userRounds } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export async function readManagerRounds(userId: string, limit = 100) {
  const seasonId = await resolveReadSeasonId();
  // Get all rounds (including non-participated) with position when participated
  const allRoundsSubquery = db
    .selectDistinct({ round_id: userRounds.roundId, round_name: userRounds.roundName })
    .from(userRounds)
    .where(eq(userRounds.seasonId, seasonId))
    .orderBy(desc(userRounds.roundId))
    .limit(limit)
    .as('all_rounds_sq');

  const roundPositionsSubquery = db
    .select({
      round_id: userRounds.roundId,
      user_id: userRounds.userId,
      points: userRounds.points,
      participated: userRounds.participated,
      position:
        sql`RANK() OVER (PARTITION BY ${userRounds.roundId} ORDER BY ${userRounds.points} DESC)`.as(
          'position'
        ),
    })
    .from(userRounds)
    .where(and(eq(userRounds.seasonId, seasonId), eq(userRounds.participated, true)))
    .as('rp_sq');

  const rows = await db
    .select({
      round_id: allRoundsSubquery.round_id,
      round_name: allRoundsSubquery.round_name,
      points: sql<number>`COALESCE(${roundPositionsSubquery.points}, 0)`,
      position: sql<number>`COALESCE(${roundPositionsSubquery.position}, 0)`,
      participated: sql<number>`CASE WHEN ${roundPositionsSubquery.user_id} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(allRoundsSubquery)
    .leftJoin(
      roundPositionsSubquery,
      and(
        eq(allRoundsSubquery.round_id, roundPositionsSubquery.round_id),
        eq(roundPositionsSubquery.user_id, userId)
      )
    )
    .orderBy(desc(allRoundsSubquery.round_id));

  const rounds = rows;

  // Count total rounds where user participated
  const countRes = await db
    .select({ total_played: count() })
    .from(userRounds)
    .where(
      and(
        eq(userRounds.seasonId, seasonId),
        eq(userRounds.userId, userId),
        eq(userRounds.participated, true)
      )
    );

  const total_played = Number(countRes[0]?.total_played) || 0;

  // Count total rounds in the season (distinct round_ids)
  const totalRoundsRes = await db
    .select({ total_rounds: sql<number>`COUNT(DISTINCT ${userRounds.roundId})`.mapWith(Number) })
    .from(userRounds)
    .where(eq(userRounds.seasonId, seasonId));

  const total_rounds = totalRoundsRes[0]?.total_rounds || 0;

  return { rounds, total_played, total_rounds };
}
