import 'server-only';
import { db } from '@/lib/db/client';
import { matches, teams } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { eq, and, asc, sql, max, min } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export { resolveReadSeasonId as resolveFixtureSeason };
export async function queryRoundInfo(roundId: string | number, seasonId: string) {
  return await db
    .select({
      round_id: matches.roundId,
      round_name: max(matches.roundName),
      start_date: min(matches.date),
      end_date: max(matches.date),
    })
    .from(matches)
    .where(and(eq(matches.seasonId, seasonId), eq(matches.roundId, Number(roundId))))
    .groupBy(matches.roundId);
}
export async function queryFinishedMatches(seasonId: string) {
  return db
    .select({
      home_id: matches.homeId,
      away_id: matches.awayId,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
      home_score_regtime: matches.homeScoreRegtime,
      away_score_regtime: matches.awayScoreRegtime,
      status: matches.status,
    })
    .from(matches)
    .where(
      and(
        eq(matches.status, 'finished'),
        eq(matches.seasonId, seasonId),
        sql`${matches.homeScore} IS NOT NULL`,
        sql`${matches.awayScore} IS NOT NULL`
      )
    );
}
export async function queryRoundFixtures(roundId: string | number, seasonId: string) {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  return db
    .select({
      home_id: matches.homeId,
      away_id: matches.awayId,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
      date: matches.date,
      status: matches.status,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
      home_logo: homeTeam.img,
      home_short: homeTeam.shortName,
      away_logo: awayTeam.img,
      away_short: awayTeam.shortName,
    })
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(and(eq(matches.seasonId, seasonId), eq(matches.roundId, Number(roundId))))
    .orderBy(asc(matches.date));
}
