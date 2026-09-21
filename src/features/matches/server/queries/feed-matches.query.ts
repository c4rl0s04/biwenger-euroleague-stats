import 'server-only';
import { db } from '@/lib/db/client';
import { matches, teams } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export async function readUpcomingFeedMatches(limit = 5) {
  const seasonId = await resolveReadSeasonId();
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(and(eq(matches.seasonId, seasonId), sql`${matches.date} > NOW()`))
    .orderBy(matches.date)
    .limit(limit);

  return rows;
}

export async function readRecentFeedResults(limit = 5) {
  const seasonId = await resolveReadSeasonId();
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(and(eq(matches.seasonId, seasonId), eq(matches.status, 'finished')))
    .orderBy(desc(matches.date))
    .limit(limit);

  return rows;
}
