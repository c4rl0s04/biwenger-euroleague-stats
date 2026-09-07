import { db } from '../../index';
import type { CalendarRound } from '@/features/rounds/public';
import {
  getRoundCalendar,
  resolveRoundIdByPolicy,
  getLastCompletedRoundId,
  getLastCompletedCalendarRound,
} from '@/features/rounds/server';
import {
  matches,
  porras,
  users,
  userRounds,
  playerRoundStats,
  lineups,
  teams,
  players,
  playerSeasons,
  userSeasons,
} from '../../schema';
import { eq, asc, desc, sql, and, gte, lt, sum, count, max, min } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getTeamPositions, StandingsMatch } from '../../../logic/standings';
import { NEXT_ROUND_CTE } from '../../sql_utils';
import { resolveReadSeasonId } from '../../season-context';

export interface PorrasRound {
  jornada: number;
  usuario: string;
  aciertos: number;
}

export interface RoundState {
  currentRound: ReturnType<typeof toLegacyRound>;
  nextRound: ReturnType<typeof toLegacyRound>;
}

export interface Round {
  round_id: number;
  round_name: string;
  start_date: string;
  end_date: string;
  matches?: Match[];
}

export interface Match {
  home_id: number;
  away_id: number;
  home_team: string;
  away_team: string;
  date: string; // or Date
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_logo?: string;
  home_short?: string;
  away_logo?: string;
  away_short?: string;
  home_position?: number | null;
  away_position?: number | null;
}

/**
 * Get all Porras rounds
 */
export async function getAllPorrasRounds(): Promise<PorrasRound[]> {
  const seasonId = await resolveReadSeasonId();
  const result = await db
    .select({
      jornada: porras.roundName, // mapped from legacy naming
      usuario: users.name,
      aciertos: porras.aciertos,
    })
    .from(porras)
    .leftJoin(users, eq(porras.userId, users.id))
    .where(eq(porras.seasonId, seasonId))
    .orderBy(desc(porras.roundId), desc(porras.aciertos));

  return result as any[];
}

/**
 * Get the state of current and next rounds
 * Unified logic to determine what is "Current" (Active Match Window) and "Next"
 * Handles postponed matches by looking at individual match dates.
 */
export async function getCurrentRoundState(): Promise<RoundState> {
  const state = await getRoundCalendar();
  return {
    currentRound: toLegacyRound(state.currentRound),
    nextRound: toLegacyRound(state.nextRound),
  };
}

/** Temporary compatibility projection: preserve Date values for existing server callers. */
function toLegacyRound(round: CalendarRound | null) {
  if (!round) return null;
  return {
    round_id: round.roundId,
    round_name: round.roundName,
    start_date: round.startDate ? new Date(round.startDate) : null,
    end_date: round.endDate ? new Date(round.endDate) : null,
    total_matches: round.totalMatches,
    finished_matches: round.finishedMatches,
    matches: round.matches.map((match) => ({
      id: match.id,
      date: match.date ? new Date(match.date) : null,
      status: match.status,
      round_id: match.roundId,
      round_name: match.roundName,
    })),
    status_calc: round.status,
  };
}

/**
 * Get full details for a specific round (matches, standings, etc.)
 */
export async function getRoundDetails(roundId: string | number): Promise<Round | null> {
  if (!roundId) return null;
  const seasonId = await resolveReadSeasonId();

  // 1. Basic info
  const basicInfo = await db
    .select({
      round_id: matches.roundId,
      round_name: max(matches.roundName),
      start_date: min(matches.date),
      end_date: max(matches.date),
    })
    .from(matches)
    .where(and(eq(matches.seasonId, seasonId), eq(matches.roundId, Number(roundId))))
    .groupBy(matches.roundId);

  if (basicInfo.length === 0) return null;
  const round: any = basicInfo[0];

  // 2. Get team positions (Global context)
  let positionMap = new Map<number, number>();
  try {
    const allFinishedMatches = (
      await db
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
        )
    ).map((m) => ({
      ...m,
      home_id: m.home_id!,
      away_id: m.away_id!,
      status: m.status!,
    })) as StandingsMatch[];

    positionMap = getTeamPositions(allFinishedMatches);
  } catch (err) {
    console.warn('Could not calculate standings:', err);
  }

  // 3. Get Matches for this round
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const roundMatches = await db
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

  round.matches = roundMatches.map((match: any) => ({
    ...match,
    home_position: positionMap.get(match.home_id) || null,
    away_position: positionMap.get(match.away_id) || null,
  }));

  return round;
}

/**
 * Select a target round ID based on a specific context policy.
 * @param policy
 *   - 'active_or_next': Priority Live > Next Upcoming > Last Finished (Dashboard/Schedule/Matches)
 *   - 'active_or_last': Priority Live > Last Finished > Next Upcoming (Rounds Page)
 */
export { resolveRoundIdByPolicy, getLastCompletedRoundId };

export async function getLastCompletedRound() {
  return toLegacyRound(await getLastCompletedCalendarRound());
}

/**
 * Get the winner of the last completed round
 */
export async function getLastRoundWinner(): Promise<any> {
  const seasonId = await resolveReadSeasonId();
  const lastRoundIdQuery = db
    .select({ round_id: matches.roundId })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .groupBy(matches.roundId)
    .having(sql`COUNT(*) = SUM(CASE WHEN ${matches.status} = 'finished' THEN 1 ELSE 0 END)`)
    .orderBy(desc(matches.roundId))
    .limit(1);

  const result = await db
    .select({
      user_id: userRounds.userId,
      name: sql<string>`COALESCE(${userSeasons.name}, ${users.name})`,
      icon: sql<string>`COALESCE(${userSeasons.icon}, ${users.icon})`,
      points: userRounds.points,
      round_name: userRounds.roundName,
    })
    .from(userRounds)
    .innerJoin(users, eq(userRounds.userId, users.id))
    .innerJoin(
      userSeasons,
      and(eq(userSeasons.userId, users.id), eq(userSeasons.seasonId, seasonId))
    )
    .where(
      and(
        eq(userRounds.seasonId, seasonId),
        eq(userRounds.roundId, sql`(${lastRoundIdQuery})`),
        eq(userRounds.participated, true)
      )
    )
    .orderBy(desc(userRounds.points))
    .limit(1);

  return result[0];
}

/**
 * Get user's recent rounds performance
 */
export { getManagerRoundsData as getUserRecentRounds } from '@/features/managers/server';

/**
 * Get best performers from the last completed round
 */
export async function getLastRoundMVPs(limit = 5): Promise<any[]> {
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
      position: players.position,
      points: playerRoundStats.fantasyPoints,
      owner_name: sql<string>`COALESCE(${userSeasons.name}, ${users.name})`,
      owner_color_index: sql<number>`COALESCE(${userSeasons.colorIndex}, ${users.colorIndex}, 0)`,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .innerJoin(
      playerSeasons,
      and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
    )
    .leftJoin(teams, eq(sql`COALESCE(${playerSeasons.teamId}, ${players.teamId})`, teams.id))
    .leftJoin(users, eq(playerSeasons.ownerId, users.id))
    .leftJoin(
      userSeasons,
      and(eq(userSeasons.userId, users.id), eq(userSeasons.seasonId, seasonId))
    )
    .where(
      and(eq(playerRoundStats.roundId, lastRoundId as any), eq(playerRoundStats.seasonId, seasonId))
    )
    .orderBy(desc(playerRoundStats.fantasyPoints))
    .limit(limit);
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 */
export async function getLastRoundStats(): Promise<any[]> {
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
      position: players.position,
      price: sql<number>`COALESCE(${playerSeasons.price}, ${players.price})`,
      points: playerRoundStats.fantasyPoints,
      owner_name: users.name,
      round_name: sql<string>`(SELECT round_name FROM matches WHERE season_id = ${seasonId} AND round_id = ${playerRoundStats.roundId} LIMIT 1)`,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .innerJoin(
      playerSeasons,
      and(eq(playerSeasons.playerId, players.id), eq(playerSeasons.seasonId, seasonId))
    )
    .leftJoin(teams, eq(sql`COALESCE(${playerSeasons.teamId}, ${players.teamId})`, teams.id))
    .leftJoin(users, eq(playerSeasons.ownerId, users.id))
    .where(
      and(eq(playerRoundStats.roundId, lastRoundId as any), eq(playerRoundStats.seasonId, seasonId))
    )
    .orderBy(desc(playerRoundStats.fantasyPoints));
}

/** Compatibility exports for unmigrated callers; Rounds owns these reads. */
export {
  getAllRounds,
  getUserLineup,
  hasOfficialStats,
  getOfficialStandings,
  getLivingStandings,
  getRoundGlobalStats,
  getIdealLineup,
  getPlayersLeftOut,
  getUserOptimization,
  getUserRoundsHistoryDAO,
  getLineupUsageStats,
  getCoachRating,
} from '@/features/rounds/server';
