import { db } from '../../index';
import { matches, teams, players, playerSeasons } from '../../schema';
import { and, eq, desc, asc, min, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { resolveReadSeasonId } from '../../season-context';

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
      home_code: homeTeam.code,
      away_code: awayTeam.code,
    })
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(and(eq(matches.roundId, roundId), eq(matches.seasonId, seasonId)))
    .orderBy(asc(matches.date));

  return rows;
}

// 5. Fetch User Players
export async function fetchUserPlayers(userId: number) {
  const seasonId = await resolveReadSeasonId();
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      team_id: sql<number>`COALESCE(${playerSeasons.teamId}, ${players.teamId})`,
      team_name: teams.shortName,
      team_code: teams.code,
      position: players.position,
      price: sql<number>`COALESCE(${playerSeasons.price}, ${players.price})`,
      img: players.img,
      puntos: sql<number>`COALESCE(${playerSeasons.puntos}, ${players.puntos})`,
    })
    .from(playerSeasons)
    .innerJoin(players, eq(playerSeasons.playerId, players.id))
    .leftJoin(teams, eq(sql`COALESCE(${playerSeasons.teamId}, ${players.teamId})`, teams.id))
    .where(and(eq(playerSeasons.seasonId, seasonId), eq(playerSeasons.ownerId, userId.toString())));

  return rows;
}
