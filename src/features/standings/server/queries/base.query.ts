import 'server-only';
import {
  getFullStandings,
  getLeagueOverview,
  fetchValueRanking,
  getSimpleStandings as readSimpleStandings,
} from '@/features/standings/server';
import type { StandingsOptions } from '@/features/standings/public';

// Temporary adapters for unmigrated composition and analytics consumers.
import { db } from '@/lib/db';
import { userRounds, users, userSeasons } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { sql } from 'drizzle-orm';

export async function getExtendedStandings(options: StandingsOptions = {}) {
  return getFullStandings(options);
}

export async function getRoundWinners(limit = 15) {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RoundResults AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        COALESCE(us.name, u.name) as name,
        COALESCE(us.icon, u.icon) as icon,
        COALESCE(us.color_index, u.color_index, 0) as color_index,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM ${userRounds} ur
      JOIN ${users} u ON ur.user_id = u.id
      JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ur.season_id
      WHERE ur.season_id = ${seasonId}
        AND ur.participated = TRUE
        AND COALESCE(us.status, 'active') = 'active'
    )
    SELECT 
      round_id,
      round_name,
      user_id,
      name,
      icon,
      color_index,
      points
    FROM RoundResults
    WHERE position = 1
    ORDER BY round_id DESC
    LIMIT ${limit}
  `);

  return result.rows;
}

export async function getLeagueTotals() {
  return getLeagueOverview();
}

export async function getPointsProgression(limit = 10) {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
      ORDER BY round_id DESC
      LIMIT ${limit}
    )
    SELECT 
      ur.user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id)::int as cumulative_points
    FROM ${userRounds} ur
    JOIN ${users} u ON ur.user_id = u.id
    JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ur.season_id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    AND ur.season_id = ${seasonId}
    AND COALESCE(us.status, 'active') = 'active'
    ORDER BY ur.round_id ASC, ur.points DESC
  `);

  return result.rows;
}

export async function getValueRanking() {
  return fetchValueRanking();
}

export async function getWinCounts() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RoundWinners AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
        AND participated = TRUE
    )
    SELECT 
      u.id as user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COUNT(rw.round_id)::int as wins
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    LEFT JOIN RoundWinners rw ON u.id = rw.user_id AND rw.position = 1
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
    GROUP BY u.id, us.name, us.icon, us.color_index
    ORDER BY wins DESC
  `);

  return result.rows;
}

export async function getSimpleStandings() {
  return readSimpleStandings();
}

export async function getLeaderComparison(userId: string) {
  // Reuse our own getSimpleStandings
  const standings: any[] = await getSimpleStandings();
  const leader = standings[0];
  const secondPlace = standings[1];

  // Ensure we compare strings properly if IDs are mixed types in DB/JS
  // Drizzle result rows are untyped ‘any’ by default unless mapped, but we know the shape.
  const user = standings.find((u: any) => String(u.user_id) === String(userId));

  if (!user || !leader) return null;

  // Cast for safety
  const leaderPoints = (leader as any).total_points;
  const userPoints = (user as any).total_points;

  const gap = leaderPoints - userPoints;
  const pos = (user as any).position;
  const roundsNeeded = pos > 1 ? Math.ceil(gap / 10) : 0;

  const gapToSecond = pos === 1 && secondPlace ? userPoints - (secondPlace as any).total_points : 0;

  return {
    leader_name: (leader as any).name,
    leader_points: leaderPoints,
    user_points: userPoints,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: pos === 1,
  };
}

export async function getLeagueAveragePoints() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    SELECT ROUND(AVG(points), 1)::float as avg_points
    FROM ${userRounds}
    WHERE season_id = ${seasonId}
      AND participated = TRUE
  `);

  return result.rows[0] ? result.rows[0].avg_points : 0;
}
