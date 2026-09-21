import { db } from '../../client';
import { getRoundDetails as readRoundDetails } from '@/features/matches/server';
import type { CalendarRound } from '@/features/rounds/public';
import {
  getRoundCalendar,
  resolveRoundIdByPolicy,
  getLastCompletedRoundId,
  getLastCompletedCalendarRound,
} from '@/features/rounds/server';
import { matches, porras, userRounds, userSeasons } from '../../schema';
import { eq, desc, sql, and } from 'drizzle-orm';
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
      usuario: userSeasons.name,
      aciertos: porras.aciertos,
    })
    .from(porras)
    .leftJoin(
      userSeasons,
      and(eq(porras.userId, userSeasons.userId), eq(porras.seasonId, userSeasons.seasonId))
    )
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
  const round = await readRoundDetails(roundId);
  if (!round) return null;
  // Existing server callers historically receive Date objects; HTTP JSON is identical.
  return {
    ...round,
    start_date: round.start_date ? new Date(round.start_date) : null,
    end_date: round.end_date ? new Date(round.end_date) : null,
    matches: round.matches.map((match) => ({
      ...match,
      date: match.date ? new Date(match.date) : null,
    })),
  } as unknown as Round;
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
      name: userSeasons.name,
      icon: userSeasons.icon,
      points: userRounds.points,
      round_name: userRounds.roundName,
    })
    .from(userRounds)
    .innerJoin(
      userSeasons,
      and(eq(userRounds.userId, userSeasons.userId), eq(userRounds.seasonId, userSeasons.seasonId))
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
export { getLastRoundMVPs, getLastRoundStats } from '@/features/rounds/server';

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
