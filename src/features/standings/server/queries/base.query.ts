import 'server-only';
import {
  getFullStandings,
  getLeagueOverview,
  fetchValueRanking,
  getSimpleStandings as readSimpleStandings,
} from '../services/base-standings.service';
import type { StandingsOptions } from '../../models/base-standings';

// Temporary adapters for unmigrated composition and analytics consumers.
import { db } from '@/lib/db/connection';
import { userRounds, userSeasons } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { sql } from 'drizzle-orm';

export async function getExtendedStandings(options: StandingsOptions = {}) {
  return getFullStandings(options);
}

import type { RoundWinner, PointsProgression } from '../../models/progression';

export async function getRoundWinners(limit = 15) {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute<RoundWinner & Record<string, unknown>>(sql`
    WITH RoundResults AS (
      SELECT
        ur.round_id,
        ur.round_name,
        ur.user_id,
        us.name as name,
        us.icon as icon,
        us.color_index as color_index,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM ${userRounds} ur
      JOIN ${userSeasons} us ON us.user_id = ur.user_id AND us.season_id = ur.season_id
      WHERE ur.season_id = ${seasonId}
        AND ur.participated = TRUE
        AND us.status = 'active'
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
  const result = await db.execute<PointsProgression & Record<string, unknown>>(sql`
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
      ORDER BY round_id DESC
      LIMIT ${limit}
    )
    SELECT
      ur.user_id,
      us.name as name,
      us.color_index as color_index,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id)::int as cumulative_points
    FROM ${userRounds} ur
    JOIN ${userSeasons} us ON us.user_id = ur.user_id AND us.season_id = ur.season_id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    AND ur.season_id = ${seasonId}
    AND us.status = 'active'
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
      us.user_id,
      us.name as name,
      us.icon as icon,
      us.color_index as color_index,
      COUNT(rw.round_id)::int as wins
    FROM ${userSeasons} us
    LEFT JOIN RoundWinners rw ON us.user_id = rw.user_id AND rw.position = 1
    WHERE us.season_id = ${seasonId}
      AND us.status = 'active'
    GROUP BY us.user_id, us.name, us.icon, us.color_index
    ORDER BY wins DESC
  `);

  return result.rows;
}

export async function getSimpleStandings() {
  return readSimpleStandings();
}
