import { db, pgClient } from '../../index';
import {
  matches,
  porras,
  users,
  userRounds,
  playerRoundStats,
  lineups,
  teams,
  players,
} from '../../schema';
import { eq, asc, desc, sql, and, gte, lt, sum, count, max, min } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { calcEfficiency } from '@/lib/utils/efficiency';
import { getTeamPositions, StandingsMatch } from '../../../logic/standings';
import { NEXT_ROUND_CTE } from '../../sql_utils';

export interface PorrasRound {
  jornada: number;
  usuario: string;
  aciertos: number;
}

export interface RoundState {
  currentRound: any | null; // Ideally type this `Round` interface below if specific enough
  nextRound: any | null;
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

export interface LineupPlayer {
  player_id: number;
  name: string;
  position: string;
  img: string;
  team: string;
  team_short: string;
  team_img: string;
  is_captain: boolean;
  role: string;
  raw_points: number | null;
  valuation: number;
  stats_points: number;
  stats_rebounds: number;
  stats_assists: number;
  minutes: number | null;
  current_status: string;
  player_exists: number | null;
  points: number;
  is_missing: boolean;
  calculated: boolean;
  multiplier?: number;
}

export interface UserLineup {
  players: LineupPlayer[];
  summary: {
    total_points: number;
    round_rank: number;
    participated: boolean;
  } | null;
}

/**
 * Get all Porras rounds
 */
export async function getAllPorrasRounds(): Promise<PorrasRound[]> {
  const result = await db
    .select({
      jornada: porras.roundName, // mapped from legacy naming
      usuario: users.name,
      aciertos: porras.aciertos,
    })
    .from(porras)
    .leftJoin(users, eq(porras.userId, users.id))
    .orderBy(desc(porras.roundId), desc(porras.aciertos));

  return result as any[];
}

/**
 * Get the state of current and next rounds
 * Unified logic to determine what is "Current" (Active Match Window) and "Next"
 * Handles postponed matches by looking at individual match dates.
 */
export async function getCurrentRoundState(): Promise<RoundState> {
  const now = new Date();

  // 1. Get all matches to analyze chronology
  const allMatches = await db
    .select({
      id: matches.id,
      date: matches.date,
      status: matches.status,
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .orderBy(asc(matches.date), asc(matches.id));

  if (allMatches.length === 0) return { currentRound: null, nextRound: null };

  // 2. Aggregate rounds metadata from the flat match list
  const roundsMap = new Map<number, any>();
  allMatches.forEach((m) => {
    const rid = m.round_id!;
    if (!roundsMap.has(rid)) {
      roundsMap.set(rid, {
        round_id: rid,
        round_name: m.round_name,
        start_date: m.date,
        end_date: m.date,
        total_matches: 0,
        finished_matches: 0,
        matches: [],
      });
    }
    const r = roundsMap.get(rid);
    r.total_matches++;
    if (m.status === 'finished') r.finished_matches++;
    r.matches.push(m);
    // Update boundaries
    if (m.date && (!r.start_date || new Date(m.date) < new Date(r.start_date)))
      r.start_date = m.date;
    if (m.date && (!r.end_date || new Date(m.date) > new Date(r.end_date))) r.end_date = m.date;
  });

  const allRounds = Array.from(roundsMap.values()).map((r) => {
    let status_calc = 'upcoming';
    const startDate = r.start_date ? new Date(r.start_date) : null;
    if (startDate && now >= startDate) {
      status_calc = r.finished_matches < r.total_matches ? 'live' : 'finished';
    }
    return { ...r, status_calc };
  });

  // 3. Current Round: The round of the earliest match that is truly LIVE (playing now).
  // Priority 1: A match currently playing (started but not finished)
  const liveMatch = allMatches.find(
    (m) => m.status !== 'finished' && m.date && new Date(m.date) <= now
  );

  let currentRound: any = null;
  if (liveMatch) {
    currentRound = allRounds.find((r) => r.round_id === liveMatch.round_id);
  } else {
    // Priority 2: If nothing is live, current is the LATEST round that has at least one match that started in the past.
    const startedMatchRounds = allMatches
      .filter((m) => m.date && new Date(m.date) <= now)
      .map((m) => m.round_id);

    if (startedMatchRounds.length > 0) {
      const latestStartedRoundId = startedMatchRounds[startedMatchRounds.length - 1];
      currentRound = allRounds.find((r) => r.round_id === latestStartedRoundId);
    } else {
      // Fallback: If no matches have started EVER (e.g. pre-season), pick first round.
      currentRound = allRounds[0];
    }
  }

  // 4. Next Round: The round of the EARLIEST match that is FUTURE and from a DIFFERENT round than current
  const nextMatch = allMatches.find((m) => {
    const isFuture = m.date && new Date(m.date) > now;
    const isDifferentRound = !currentRound || m.round_id !== currentRound.round_id;
    return isFuture && isDifferentRound;
  });

  let nextRound = nextMatch ? allRounds.find((r) => r.round_id === nextMatch.round_id) : null;

  // Final validation: If no current was found (e.g. pre-season), next becomes the first round.
  if (!currentRound && allRounds.length > 0) {
    currentRound = allRounds[0];
    nextRound = allRounds[1] || null;
  }

  return { currentRound, nextRound };
}

/**
 * Get full details for a specific round (matches, standings, etc.)
 */
export async function getRoundDetails(roundId: string | number): Promise<Round | null> {
  if (!roundId) return null;

  // 1. Basic info
  const basicInfo = await db
    .select({
      round_id: matches.roundId,
      round_name: max(matches.roundName),
      start_date: min(matches.date),
      end_date: max(matches.date),
    })
    .from(matches)
    .where(eq(matches.roundId, Number(roundId)))
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
    .where(eq(matches.roundId, Number(roundId)))
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
export async function resolveRoundIdByPolicy(
  policy: 'active_or_next' | 'active_or_last'
): Promise<number | null> {
  const { currentRound, nextRound } = await getCurrentRoundState();

  const isLive = currentRound?.status_calc === 'live';
  const isFinished = currentRound?.status_calc === 'finished';

  if (policy === 'active_or_next') {
    if (isLive) return currentRound.round_id;
    if (nextRound) return nextRound.round_id;
    return currentRound?.round_id || null;
  }

  if (policy === 'active_or_last') {
    if (isLive) return currentRound.round_id;
    if (isFinished) return currentRound.round_id;
    return nextRound?.round_id || null;
  }

  return null;
}

/**
 * Get the current active or last completed round ID using the 'active_or_last' policy.
 */
export async function getLastCompletedRoundId(): Promise<number | null> {
  return await resolveRoundIdByPolicy('active_or_last');
}

/**
 * Get the current active or last completed round object
 */
export async function getLastCompletedRound(): Promise<any> {
  const roundId = await getLastCompletedRoundId();
  if (!roundId) return null;

  // We need to fetch the round details since it's used as an object in many places
  const { currentRound, nextRound } = await getCurrentRoundState();
  return currentRound?.round_id === roundId ? currentRound : nextRound;
}

/**
 * Get the winner of the last completed round
 */
export async function getLastRoundWinner(): Promise<any> {
  const lastRoundIdQuery = db
    .select({ round_id: matches.roundId })
    .from(matches)
    .groupBy(matches.roundId)
    .having(sql`COUNT(*) = SUM(CASE WHEN ${matches.status} = 'finished' THEN 1 ELSE 0 END)`)
    .orderBy(desc(matches.roundId))
    .limit(1);

  const result = await db
    .select({
      user_id: userRounds.userId,
      name: users.name,
      icon: users.icon,
      points: userRounds.points,
      round_name: userRounds.roundName,
    })
    .from(userRounds)
    .innerJoin(users, eq(userRounds.userId, users.id))
    .where(
      and(eq(userRounds.roundId, sql`(${lastRoundIdQuery})`), eq(userRounds.participated, true))
    )
    .orderBy(desc(userRounds.points))
    .limit(1);

  return result[0];
}

/**
 * Get user's recent rounds performance
 */
export async function getUserRecentRounds(userId: string, limit = 10) {
  // Get all rounds (including non-participated) with position when participated
  const allRoundsSubquery = db
    .selectDistinct({ round_id: userRounds.roundId, round_name: userRounds.roundName })
    .from(userRounds)
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
    .where(eq(userRounds.participated, true))
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

  const rounds = rows.map((row: any) => ({
    ...row,
    points: parseInt(row.points) || 0,
    position: parseInt(row.position) || 0,
  }));

  // Count total rounds where user participated
  const countRes = await db
    .select({ total_played: count() })
    .from(userRounds)
    .where(and(eq(userRounds.userId, userId), eq(userRounds.participated, true)));

  const total_played = Number(countRes[0]?.total_played) || 0;

  // Count total rounds in the season (distinct round_ids)
  const totalRoundsRes = await db
    .select({ total_rounds: sql<number>`COUNT(DISTINCT ${userRounds.roundId})`.mapWith(Number) })
    .from(userRounds);

  const total_rounds = totalRoundsRes[0]?.total_rounds || 0;

  return { rounds, total_played, total_rounds };
}

/**
 * Get best performers from the last completed round
 */
export async function getLastRoundMVPs(limit = 5): Promise<any[]> {
  const lastRoundRes = await db
    .select({
      last_round_id: matches.roundId,
    })
    .from(matches)
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
      owner_name: users.name,
      owner_color_index: users.colorIndex,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .leftJoin(users, eq(players.ownerId, users.id))
    .where(eq(playerRoundStats.roundId, lastRoundId as any))
    .orderBy(desc(playerRoundStats.fantasyPoints))
    .limit(limit);
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 */
export async function getLastRoundStats(): Promise<any[]> {
  const lastRoundRes = await db
    .select({
      last_round_id: matches.roundId,
    })
    .from(matches)
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
      price: players.price,
      points: playerRoundStats.fantasyPoints,
      owner_name: users.name,
      round_name: sql<string>`(SELECT round_name FROM matches WHERE round_id = ${playerRoundStats.roundId} LIMIT 1)`,
    })
    .from(playerRoundStats)
    .innerJoin(players, eq(playerRoundStats.playerId, players.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .leftJoin(users, eq(players.ownerId, users.id))
    .where(eq(playerRoundStats.roundId, lastRoundId as any))
    .orderBy(desc(playerRoundStats.fantasyPoints));
}

/**
 * Get all rounds available in the system
 */
export async function getAllRounds(): Promise<any[]> {
  return await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .groupBy(matches.roundId, matches.roundName)
    .orderBy(desc(matches.roundId));
}

/**
 * Helper: Infer a ghost player's position for the optimization pool.
 *
 * TITULAR ghost (starter in actual lineup):
 *   A valid 5-starter formation has at most 3 players per position (Base/Alero/Pivot).
 *   Knowing the other 4 starters' positions often uniquely identifies the ghost's position.
 *   If multiple positions are valid, we pick the rarest to minimise cap conflicts.
 *
 * BENCH / 6TH_MAN ghost:
 *   We can't determine their position from lineup structure (bench slots have no positional
 *   constraint). Instead, we use the rarest position across the whole squad pool so the
 *   ghost has the best chance of competing for an open starter slot in the ideal lineup.
 */
function inferGhostPosition(
  allLineupPlayers: LineupPlayer[],
  ghost: LineupPlayer,
  squadPool?: any[]
): string {
  const POSITIONS = ['Base', 'Alero', 'Pivot'] as const;

  if (ghost.role !== 'titular') {
    // Bench / 6th_man ghost — position is unknown from lineup structure.
    // Use the rarest position in the existing squad pool to maximise starter-slot availability.
    const count: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
    for (const p of squadPool ?? []) {
      if (count[p.position] !== undefined) count[p.position]++;
    }
    return [...POSITIONS].sort((a, b) => count[a] - count[b])[0];
  }

  // Titular ghost — infer from the positions of the other 4 known starters.
  const count: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  for (const p of allLineupPlayers) {
    if (!p.is_missing && p.role === 'titular' && count[p.position] !== undefined) {
      count[p.position]++;
    }
  }

  // Valid positions: those still under the starter cap of 3.
  const valid = POSITIONS.filter((pos) => count[pos] < 3);

  if (valid.length === 0) return 'Base'; // Defensive fallback (shouldn't happen).
  if (valid.length === 1) return valid[0]; // Uniquely determined.

  // Multiple valid slots — pick the rarest to leave the most room for other players.
  return [...valid].sort((a, b) => count[a] - count[b])[0];
}

/**
 * Helper: Calculate weighted sum of fantasy points for lineup players
 * Uses Biwenger multipliers: Captain 2x, Titular 1x, 6th Man 0.75x, Bench 0.5x
 */
function calculateWeightedSum(players: LineupPlayer[]): number {
  return players.reduce((sum, p) => {
    const mult = p.is_captain
      ? 2.0
      : p.role === 'titular'
        ? 1.0
        : p.role === '6th_man'
          ? 0.75
          : 0.5;
    return sum + (p.points || 0) * mult;
  }, 0);
}

/**
 * Get user lineup for a specific round
 * Includes dynamic calculation of missing player stats (players who left competition)
 */
export async function getUserLineup(userId: string, roundId: string | number): Promise<UserLineup> {
  // 1. Get detailed lineup stats
  const query = `
    SELECT 
      l.player_id,
      COALESCE(p.name, 'Unknown Player') as name,
      COALESCE(p.position, 'Bench') as position,
      p.img,
      COALESCE(t.name, 'Unknown Team') as team,
      t.short_name as team_short,
      t.img as team_img,
      l.is_captain,
      l.role,
      prs.fantasy_points as raw_points,
      COALESCE(prs.valuation, 0) as valuation,
      COALESCE(prs.points, 0) as stats_points,
      COALESCE(prs.rebounds, 0) as stats_rebounds,
      COALESCE(prs.assists, 0) as stats_assists,
      prs.minutes,
      p.status as current_status,
      p.id as player_exists
    FROM lineups l
    LEFT JOIN players p ON l.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.round_id = $2
    ORDER BY 
      CASE 
        WHEN p.position = 'Base' THEN 1
        WHEN p.position = 'Alero' THEN 2
        WHEN p.position = 'Pivot' THEN 3
        ELSE 4
      END
  `;

  const rawLineup: any[] = (await pgClient.query(query, [userId, roundId])).rows;

  // 2. Get User Round totals
  const totalsQuery = `
    SELECT 
      ur.points, 
      ur.participated,
      (
        SELECT COUNT(*) + 1 
        FROM user_rounds ur2 
        WHERE ur2.round_id = $2 AND ur2.points > ur.points
      ) as position
    FROM user_rounds ur
    WHERE ur.user_id = $1 AND ur.round_id = $2
  `;
  const totals = (await pgClient.query(totalsQuery, [userId, roundId])).rows[0];

  // 3. Process lineup and detect missing players (ghost players)
  const lineup: LineupPlayer[] = rawLineup.map((p) => ({
    ...p,
    points: parseInt(p.raw_points) || 0,
    stats_points: parseInt(p.stats_points) || 0,
    valuation: parseInt(p.valuation) || 0,
    is_missing: p.player_exists === null, // Flag missing players
    calculated: false,
  }));

  // 4. Calculate missing player fantasy points dynamically
  // Only works if exactly 1 player is missing stats
  const missingPlayers = lineup.filter((p) => p.is_missing && p.raw_points === null);
  const knownPlayers = lineup.filter((p) => !p.is_missing || p.raw_points !== null);

  if (missingPlayers.length === 1 && totals?.points) {
    const missing = missingPlayers[0];
    const totalPoints = parseInt(totals.points) || 0;
    const knownSum = calculateWeightedSum(knownPlayers);

    // Calculate the weighted contribution of the missing player
    let missingWeightedContribution = totalPoints - knownSum;

    // Derive base fantasy points by dividing by the player's multiplier
    const mult = missing.is_captain
      ? 2.0
      : missing.role === 'titular'
        ? 1.0
        : missing.role === '6th_man'
          ? 0.75
          : 0.5;

    const calculatedPoints = Math.round(missingWeightedContribution / mult);

    // Update the missing player's points
    missing.points = calculatedPoints;
    missing.calculated = true; // Flag that this was calculated, not from DB
  } else if (missingPlayers.length > 1) {
    console.warn(
      `[getUserLineup] Multiple missing players for user ${userId} round ${roundId}. Cannot calculate individual points.`
    );
  }

  return {
    players: lineup,
    summary: totals
      ? {
          total_points: parseInt(totals.points) || 0,
          round_rank: parseInt(totals.position) || 0,
          participated: totals.participated,
        }
      : null,
  };
}

/**
 * Check if a round has official stats in user_rounds
 */
export async function hasOfficialStats(roundId: string | number): Promise<boolean> {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM user_rounds 
      WHERE round_id = $1 AND participated = TRUE
    ) as exists
  `;
  const res = await pgClient.query(query, [roundId]);
  return res.rows[0]?.exists || false;
}

/**
 * Get OFFICIAL standings from user_rounds (Final/Official results)
 * Returns both round points and cumulative (total) points up to the selected round.
 */
export async function getOfficialStandings(roundId: string | number): Promise<any[]> {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.icon, 
      u.color_index,
      COALESCE(ur.points, 0) as round_points,
      COALESCE(
        (SELECT SUM(ur2.points) 
         FROM user_rounds ur2 
         WHERE ur2.user_id = u.id 
           AND ur2.round_id <= $1
           AND ur2.participated = true), 
        0
      ) as total_points,
      ur.participated
    FROM users u
    LEFT JOIN user_rounds ur ON u.id = ur.user_id AND ur.round_id = $1
    ORDER BY round_points DESC, u.name ASC
  `;
  return (await pgClient.query(query, [roundId])).rows.map((row: any) => ({
    ...row,
    points: parseInt(row.round_points) || 0,
    round_points: parseInt(row.round_points) || 0,
    total_points: parseInt(row.total_points) || 0,
    participated: !!row.participated,
  }));
}

/**
 * Get LIVE/VIRTUAL standings calculated from lineups + player stats
 * Used when official stats are not yet available.
 * Returns both calculated round points and cumulative total_points from past rounds.
 */
export async function getLivingStandings(roundId: string | number): Promise<any[]> {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.icon, 
      u.color_index,
      COALESCE(
        SUM(
          COALESCE(prs.fantasy_points, 0) * 
          CASE 
            WHEN l.is_captain::int = 1 THEN 2.0
            WHEN l.role = 'titular' THEN 1.0
            WHEN l.role = '6th_man' THEN 0.75
            ELSE 0.5
          END
        ), 
      0) as round_points,
      COALESCE(
        (SELECT SUM(ur2.points) 
         FROM user_rounds ur2 
         WHERE ur2.user_id = u.id 
           AND ur2.round_id < $1
           AND ur2.participated = true), 
        0
      ) as past_total,
      MAX(CASE WHEN l.player_id IS NOT NULL THEN 1 ELSE 0 END) as participated
    FROM users u
    LEFT JOIN lineups l ON u.id = l.user_id AND l.round_id = $1
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND prs.round_id = $1
    GROUP BY u.id
    ORDER BY round_points DESC, u.name ASC
  `;

  return (await pgClient.query(query, [roundId])).rows.map((row: any) => {
    const round_points = Math.round(parseFloat(row.round_points) || 0);
    const past_total = parseInt(row.past_total) || 0;
    return {
      ...row,
      points: round_points,
      round_points: round_points,
      total_points: past_total + round_points,
      participated: !!row.participated,
    };
  });
}

/**
 * Get detailed statistics for a specific round
 */
export async function getRoundGlobalStats(roundId: string | number): Promise<any> {
  // 1. Round MVP (Fantasy Points Leader)
  const mvpQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.fantasy_points DESC NULLS LAST
    LIMIT 1
  `;

  // 2. Top Scorer (Real Points Leader)
  const topScorerQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.points as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.points DESC NULLS LAST
    LIMIT 1
  `;

  // 3. Top Rebounder
  const topRebounderQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.rebounds as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.rebounds DESC NULLS LAST
    LIMIT 1
  `;

  // 4. Top Assister
  const topAssisterQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.assists as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.assists DESC NULLS LAST
    LIMIT 1
  `;

  // 5. Average Score
  const avgQuery = `
    SELECT ROUND(AVG(points), 1) as avg_score
    FROM user_rounds
    WHERE round_id = $1 AND participated = TRUE
  `;

  // 6. Highest Score (Round Winner)
  const winnerQuery = `
    SELECT u.name, ur.points, u.icon
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id = $1 AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;

  const [mvpRes, topScorerRes, topRebounderRes, topAssisterRes, avgRes, winnerRes] =
    await Promise.all([
      pgClient.query(mvpQuery, [roundId]),
      pgClient.query(topScorerQuery, [roundId]),
      pgClient.query(topRebounderQuery, [roundId]),
      pgClient.query(topAssisterQuery, [roundId]),
      pgClient.query(avgQuery, [roundId]),
      pgClient.query(winnerQuery, [roundId]),
    ]);

  return {
    mvp: mvpRes.rows[0] || null,
    topScorer: topScorerRes.rows[0] || null,
    topRebounder: topRebounderRes.rows[0] || null,
    topAssister: topAssisterRes.rows[0] || null,
    avgScore: parseFloat(avgRes.rows[0]?.avg_score) || 0,
    winner: winnerRes.rows[0] || null,
  };
}

/**
 * Get the Ideal Lineup (Best 5 players) for a round
 */
export async function getIdealLineup(roundId: string | number): Promise<LineupPlayer[]> {
  // Fetch top 50 to ensure we have enough for valid formations
  const query = `
    SELECT 
      p.id as player_id, p.name, p.position, p.img, p.team_id,
      t.short_name as team_short, t.img as team_img,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.fantasy_points DESC
    LIMIT 50
  `;

  const allStats: any[] = (await pgClient.query(query, [roundId])).rows;

  // LOGIC: Valid Formation Greedy Algorithm (Same as Coach Rating)
  // - Starts: 5 players. Max 3 per position (Base, Alero, Pivot).
  // - Bench: Next 5 best players.

  const starters: any[] = [];
  const bench: any[] = [];
  const rolesCount: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set<number>();

  // A. Select Starters
  for (const p of allStats) {
    if (starters.length >= 5) break;

    const pos = p.position || 'Base';
    if ((rolesCount[pos] || 0) < 3) {
      starters.push(p);
      rolesCount[pos] = (rolesCount[pos] || 0) + 1;
      usedIds.add(p.player_id);
    }
  }

  // B. Select Bench (Next 5)
  for (const p of allStats) {
    if (bench.length >= 5) break;
    if (!usedIds.has(p.player_id)) {
      bench.push(p);
      usedIds.add(p.player_id);
    }
  }

  const idealLineupRaw = [...starters, ...bench];

  const idealLineup = idealLineupRaw.map((p, index) => {
    let multiplier = 0;
    let role = 'bench';
    let is_captain = false;

    // Starters
    if (index < 5) {
      role = 'titular';
      if (index === 0) {
        multiplier = 2.0;
        is_captain = true;
      } else {
        multiplier = 1.0;
      }
    }
    // Bench
    else {
      role = index === 5 ? '6th_man' : 'bench';
      multiplier = index === 5 ? 0.75 : 0.5;
    }

    return {
      ...p,
      role,
      is_captain,
      stats_points: p.points,
      multiplier,
    } as LineupPlayer;
  });

  const totalPoints = Math.round(calculateWeightedSum(idealLineup));

  return {
    idealLineup,
    totalPoints,
  } as any;
}

/**
 * HELPER: Reconstruct the user's squad at the start of a specific round.
 * Uses current ownership + transfer history replay.
 */
async function getHistoricSquad(userId: string, roundId: string | number): Promise<Set<number>> {
  try {
    // 1. Get User Name (fichajes table stores names, not IDs)
    const userRes = await pgClient.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return new Set();
    const userName = userRes.rows[0].name;

    // 2. Get Round Start Date (Lock Time)
    const roundRes = await pgClient.query(
      'SELECT MIN(date) as start_date FROM matches WHERE round_id = $1',
      [roundId]
    );
    if (!roundRes.rows[0]?.start_date) return new Set();

    // Ensure we compare timestamps correctly (Postgres Date -> JS Timestamp)
    // fichajes.timestamp is in SECONDS (BigInt), matches.date is Date object.
    const roundTs = Math.floor(new Date(roundRes.rows[0].start_date).getTime() / 1000);

    // [TIMEZONE FIX] User reports DB dates are 1 hour early (e.g. 15:00 UTC vs actual 17:00 Madrid/16:00 UTC).
    // Adding 1 hour (3600 seconds) buffer to align with reality.
    // This ensures transfers that happened "before" the real match (but after the wrong DB time) are kept.
    const adjustedRoundTs = roundTs + 3600;

    // 3. Get Current Squad
    const squadRes = await pgClient.query('SELECT id FROM players WHERE owner_id = $1', [userId]);
    const squad = new Set<number>(squadRes.rows.map((r: any) => r.id));

    // 4. Fetch Transfers that happened AFTER the round start
    // We need to reverse these actions to get back to the state at round_start.
    const transfersRes = await pgClient.query(
      `
      SELECT player_id, vendedor, comprador, timestamp
      FROM fichajes 
      WHERE (vendedor = $1 OR comprador = $1)
        AND timestamp >= $2
      ORDER BY timestamp DESC
      `,
      [userName, adjustedRoundTs]
    );

    // 5. Replay history BACKWARDS
    for (const transfer of transfersRes.rows) {
      const { player_id, vendedor, comprador } = transfer;

      // If use BOUGHT player X after round, then at round start they DID NOT have X.
      if (comprador === userName) {
        squad.delete(player_id);
      }
      // If user SOLD player X after round, then at round start they DID have X.
      else if (vendedor === userName) {
        squad.add(player_id);
      }
    }

    return squad;
  } catch (err) {
    console.error('Error calculating historic squad:', err);
    return new Set<number>();
  }
}

/**
 * Get the players left out of the lineup who performed well
 */
export async function getPlayersLeftOut(userId: string, roundId: string | number) {
  // 1. Get Historic Squad at round start
  const historicSquad = await getHistoricSquad(userId, roundId);
  if (historicSquad.size === 0) return [];

  // 2. Get User's Actual Lineup
  const lineupQuery = `
    SELECT player_id FROM lineups WHERE user_id = $1 AND round_id = $2
  `;
  const lineupRes = await pgClient.query(lineupQuery, [userId, roundId]);
  const lineupIds = new Set(lineupRes.rows.map((r: any) => r.player_id));

  // 3. Find players in Squad but NOT in Lineup
  const leftOutIds = Array.from(historicSquad).filter((id) => !lineupIds.has(id));

  if (leftOutIds.length === 0) return [];

  // 4. Get stats for left out players
  const statsQuery = `
    SELECT 
      prs.player_id,
      p.name,
      p.position,
      p.img,
      t.short_name as team_short,
      t.img as team_img,
      prs.fantasy_points as points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1 AND prs.player_id = ANY($2)
    ORDER BY prs.fantasy_points DESC
  `;

  return (await pgClient.query(statsQuery, [roundId, leftOutIds])).rows;
}

/**
 * Get the optimal lineup a user COULD have fielded
 */
export async function getUserOptimization(userId: string, roundId: string | number) {
  // 1. Get Historic Squad
  const historicSquad = await getHistoricSquad(userId, roundId);
  if (historicSquad.size === 0) return null;

  // 2. Get Stats for ALL squad players
  const statsQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      p.img,
      t.short_name as team_short,
      t.img as team_img,
      COALESCE(prs.fantasy_points, 0) as points,
      COALESCE(prs.valuation, 0) as valuation
    FROM players p
    LEFT JOIN player_round_stats prs ON prs.player_id = p.id AND prs.round_id = $1
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.id = ANY($2)
    ORDER BY COALESCE(prs.fantasy_points, 0) DESC
  `;

  const squadStats = (await pgClient.query(statsQuery, [roundId, Array.from(historicSquad)])).rows;

  // 3. Inject ghost players (players in lineups but deleted from the players table).
  //    getHistoricSquad cannot find them because it queries players.owner_id, and ghost
  //    players have been removed from the players table entirely.
  //    getUserLineup already back-calculates their points (total - known players weighted sum).
  //    We inject them here so the greedy algorithm can include them in the optimal lineup,
  //    which prevents actualScore > maxScore (efficiency > 100%).
  const lineupPlayers = await getUserLineup(userId, roundId);
  if (lineupPlayers) {
    const knownIds = new Set(squadStats.map((s: any) => s.player_id));
    for (const player of lineupPlayers.players) {
      if (!knownIds.has(player.player_id)) {
        squadStats.push({
          player_id: player.player_id,
          name: player.name || 'Unknown Player',
          position:
            player.position && player.position !== 'Bench'
              ? player.position
              : inferGhostPosition(lineupPlayers.players, player, squadStats),
          img: player.img ?? null,
          team_short: player.team_short ?? null,
          team_img: player.team_img ?? null,
          points: player.points,
          valuation: player.valuation || 0,
        });
        knownIds.add(player.player_id);
      }
    }
    // Re-sort by points descending so the greedy algorithm picks the best players first.
    squadStats.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
  }

  // 3. Logic: Valid Formation Greedy Algorithm (Reused from Ideal Lineup / Coach Rating)
  // - Starts: 5 players. Max 3 per position.
  // - Bench: Next 5 best.

  const starters: any[] = [];
  const bench: any[] = [];
  const rolesCount: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set<number>();

  // A. Select Starters
  for (const p of squadStats) {
    if (starters.length >= 5) break;

    const pos = p.position || 'Base';
    if ((rolesCount[pos] || 0) < 3) {
      starters.push(p);
      rolesCount[pos] = (rolesCount[pos] || 0) + 1;
      usedIds.add(p.player_id);
    }
  }

  // B. Select Bench
  for (const p of squadStats) {
    if (bench.length >= 5) break;
    if (!usedIds.has(p.player_id)) {
      bench.push(p);
      usedIds.add(p.player_id);
    }
  }

  const optimalLineup = [...starters, ...bench];

  // Build the role-mapped lineup ONCE — used for both score calculation and the return value.
  // Previously the role mapping was done inline inside calculateWeightedSum and discarded,
  // so the returned optimalLineup had no role/is_captain info → all players showed as bench.
  const mappedLineup: LineupPlayer[] = optimalLineup.map((p, index) => {
    let multiplier = 0;
    let role = 'bench';
    let is_captain = false;

    if (index < 5) {
      role = 'titular';
      if (index === 0) {
        multiplier = 2.0;
        is_captain = true;
      } else {
        multiplier = 1.0;
      }
    } else {
      role = index === 5 ? '6th_man' : 'bench';
      multiplier = index === 5 ? 0.75 : 0.5;
    }

    return { ...p, role, is_captain, points: p.points } as LineupPlayer;
  });

  const totalPoints = calculateWeightedSum(mappedLineup);

  return {
    optimalLineup: mappedLineup,
    totalPoints,
  };
}

/**
 * Get full user history for all rounds (DAO)
 */
export async function getUserRoundsHistoryDAO(userId: string) {
  const query = `
    SELECT 
      ur.round_id,
      ur.points as actual_points,
      ur.participated,
      m.round_name
    FROM user_rounds ur
    JOIN (
      SELECT round_id, MAX(round_name) as round_name 
      FROM matches 
      GROUP BY round_id
    ) m ON ur.round_id = m.round_id
    WHERE ur.user_id = $1
    ORDER BY ur.round_id ASC
  `;
  return (await pgClient.query(query, [userId])).rows;
}

/**
 * Get usage stats for different lineup formations
 */
export async function getLineupUsageStats() {
  const globalQuery = `
    WITH PerRoundFormation AS (
      SELECT
        l.round_id,
        l.user_id,
        SUM(CASE WHEN p.position = 'Base' THEN 1 ELSE 0 END)::int as base_count,
        SUM(CASE WHEN p.position = 'Alero' THEN 1 ELSE 0 END)::int as alero_count,
        SUM(CASE WHEN p.position = 'Pivot' THEN 1 ELSE 0 END)::int as pivot_count,
        COUNT(*)::int as starters_count,
        SUM(CASE WHEN p.position IN ('Base', 'Alero', 'Pivot') THEN 1 ELSE 0 END)::int as known_pos_count
      FROM lineups l
      LEFT JOIN players p ON l.player_id = p.id
      WHERE l.role = 'titular'
      GROUP BY l.round_id, l.user_id
      HAVING COUNT(*) = 5
         AND SUM(CASE WHEN p.position IN ('Base', 'Alero', 'Pivot') THEN 1 ELSE 0 END) = 5
    )
    SELECT
      l.user_id,
      CONCAT(
        l.base_count, '-',
        l.alero_count, '-',
        l.pivot_count
      ) as alineacion,
      COUNT(*) as count
    FROM PerRoundFormation l
    GROUP BY l.round_id, l.user_id, l.base_count, l.alero_count, l.pivot_count
  `;

  // Wrap in outer query to group by formation
  const finalGlobalQuery = `
    WITH Formations AS (
      ${globalQuery}
    )
    SELECT alineacion, COUNT(*)::int as count
    FROM Formations
    GROUP BY alineacion
    ORDER BY count DESC
  `;

  const userQuery = `
    WITH Formations AS (
      ${globalQuery}
    ),
    UserFormationCounts AS (
      SELECT user_id, alineacion, COUNT(*)::int as count
      FROM Formations
      GROUP BY user_id, alineacion
    ),
    Ranked AS (
      SELECT
        user_id,
        alineacion,
        count,
        SUM(count) OVER (PARTITION BY user_id)::int as total_count,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY count DESC, alineacion ASC) as formation_rank
      FROM UserFormationCounts
    )
    SELECT user_id, alineacion, count, total_count, formation_rank
    FROM Ranked
    WHERE formation_rank <= 2
    ORDER BY user_id, formation_rank
  `;

  const [globalRes, userRes] = await Promise.all([
    pgClient.query(finalGlobalQuery),
    pgClient.query(userQuery),
  ]);

  return {
    global: globalRes.rows,
    byUser: userRes.rows,
  };
}

/**
 * Calculate the Coach Rating for a user in a specific round.
 * This determines the "Max Possible Score" a user could have achieved
 * with their squad (Ideal Lineup from owned players).
 */
export async function getCoachRating(userId: string, roundId: string | number) {
  const optimization = await getUserOptimization(userId, roundId);
  const userLineup = await getUserLineup(userId, roundId);

  // If we can't get optimization data, we cannot compute coach rating.
  if (!optimization || !userLineup) {
    return null;
  }

  const maxScore = Math.round(optimization.totalPoints);
  // In live rounds user_rounds rows may not exist yet, so summary can be null.
  // Fall back to calculating the live score directly from lineup player stats.
  const actualScore = Math.round(
    userLineup.summary ? userLineup.summary.total_points : calculateWeightedSum(userLineup.players)
  );

  // calcEfficiency is the single source of truth: actual/ideal, capped at 100.
  const efficiency = calcEfficiency(actualScore, maxScore);

  return {
    actualScore,
    maxScore,
    efficiency,
    idealLineup: optimization.optimalLineup,
  };
}
