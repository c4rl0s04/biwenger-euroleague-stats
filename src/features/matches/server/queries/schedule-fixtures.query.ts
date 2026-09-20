import 'server-only';
import { db } from '@/lib/db/client';
import { matches, teams } from '@/lib/db/schema';
import { and, eq, desc, asc, min, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { resolveReadSeasonId } from '@/lib/db/season-context';

// 1. Get List of Rounds (with deduplication logic handled in JS for now or refined SQL)
/**
 * Get all unique rounds with matches for the schedule selector
 */
export async function getScheduleRounds() {
  const seasonId = await resolveReadSeasonId();
  const rows = await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
      min_date: min(matches.date),
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .groupBy(matches.roundId, matches.roundName)
    .orderBy(asc(min(matches.date)));

  return rows;
}

// 2. Get Round by ID
export async function getRoundById(roundId: number) {
  const seasonId = await resolveReadSeasonId();
  const result = await db
    .selectDistinct({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .where(and(eq(matches.roundId, roundId), eq(matches.seasonId, seasonId)))
    .limit(1);

  return result[0];
}

// 3. Get Last Round
export async function getLastRound() {
  const seasonId = await resolveReadSeasonId();
  const result = await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .orderBy(desc(matches.date))
    .limit(1);

  return result[0];
}

// 4. Fetch Matches for Round
export async function fetchMatchesForRound(roundId: number) {
  const seasonId = await resolveReadSeasonId();
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      match_id: matches.id,
      date: matches.date,
      home_id: matches.homeId,
      away_id: matches.awayId,
      home_team: homeTeam.shortName, // mapped from 'short_name'
      away_team: awayTeam.shortName,
      home_code: sql<string>`COALESCE((SELECT provider_team_code FROM official_team_mappings WHERE season_id=${seasonId} AND team_id=${homeTeam.id} AND provider='euroleague_advanced'), ${homeTeam.code})`,
      away_code: sql<string>`COALESCE((SELECT provider_team_code FROM official_team_mappings WHERE season_id=${seasonId} AND team_id=${awayTeam.id} AND provider='euroleague_advanced'), ${awayTeam.code})`,
    })
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(and(eq(matches.roundId, roundId), eq(matches.seasonId, seasonId)))
    .orderBy(asc(matches.date));

  return rows;
}
