import 'server-only';
import { db } from '@/lib/db/client';
import {
  matches,
  playerRoundStats,
  players,
  playerSeasons,
  userSeasons,
  teams,
} from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function queryLastRoundMVPs(limit = 5) {
  const seasonId = await resolveReadSeasonId();
  const lastRoundRes = await db
    .select({
      last_round_id: matches.roundId,
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .groupBy(matches.roundId)
    .having(sql`COUNT(*) = SUM(CASE WHEN ${matches.status} = 'finished' THEN 1 ELSE 0 END)`)
    .orderBy(desc(matches.roundId))
    .limit(1);

  if (!lastRoundRes[0]) return [];
  const lastRoundId = lastRoundRes[0].last_round_id;

  return await db
    .select({
      player_id: playerRoundStats.playerId,
      name: players.name,
      team: teams.name,
      position: playerSeasons.position,
      points: playerRoundStats.fantasyPoints,
      owner_name: userSeasons.name,
      owner_color_index: userSeasons.colorIndex,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .innerJoin(
      playerSeasons,
      and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
    )
    .leftJoin(teams, eq(playerSeasons.teamId, teams.id))
    .leftJoin(
      userSeasons,
      and(
        eq(playerSeasons.ownerId, userSeasons.userId),
        eq(playerSeasons.seasonId, userSeasons.seasonId)
      )
    )
    .where(
      and(
        eq(playerRoundStats.roundId, lastRoundId as number),
        eq(playerRoundStats.seasonId, seasonId)
      )
    )
    .orderBy(desc(playerRoundStats.fantasyPoints))
    .limit(limit);
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 */
export async function queryLastRoundStats() {
  const seasonId = await resolveReadSeasonId();
  const lastRoundRes = await db
    .select({
      last_round_id: matches.roundId,
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .groupBy(matches.roundId)
    .having(sql`COUNT(*) = SUM(CASE WHEN ${matches.status} = 'finished' THEN 1 ELSE 0 END)`)
    .orderBy(desc(matches.roundId))
    .limit(1);

  if (!lastRoundRes[0]) return [];
  const lastRoundId = lastRoundRes[0].last_round_id;

  return await db
    .select({
      player_id: playerRoundStats.playerId,
      name: players.name,
      team: teams.name,
      position: playerSeasons.position,
      price: playerSeasons.price,
      points: playerRoundStats.fantasyPoints,
      owner_name: userSeasons.name,
      round_name: sql<string>`(SELECT round_name FROM matches WHERE season_id = ${seasonId} AND round_id = ${playerRoundStats.roundId} LIMIT 1)`,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .innerJoin(
      playerSeasons,
      and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
    )
    .leftJoin(teams, eq(playerSeasons.teamId, teams.id))
    .leftJoin(
      userSeasons,
      and(
        eq(playerSeasons.ownerId, userSeasons.userId),
        eq(playerSeasons.seasonId, userSeasons.seasonId)
      )
    )
    .where(
      and(
        eq(playerRoundStats.roundId, lastRoundId as number),
        eq(playerRoundStats.seasonId, seasonId)
      )
    )
    .orderBy(desc(playerRoundStats.fantasyPoints));
}
