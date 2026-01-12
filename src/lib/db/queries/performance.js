import { db } from '../client.js';

/**
 * Get volatility stats (Standard Deviation of points)
 * @returns {Promise<Array>} Users sorted by consistency (lower std_dev is better)
 */
export async function getVolatilityStats() {
  const query = `
    WITH Stats AS (
      SELECT 
        user_id,
        AVG(points) as avg_points,
        -- Postgres has STDDEV, but for consistency with previous manual calculation logic:
        STDDEV(points) as std_dev
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      ROUND(s.avg_points, 1) as avg_points,
      ROUND(s.std_dev, 2) as std_dev
    FROM users u
    JOIN Stats s ON u.id = s.user_id
    ORDER BY s.std_dev ASC
  `;
  // Note: Postgres `STDDEV` returns numeric/float, `ROUND` works fine.
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    avg_points: parseFloat(row.avg_points) || 0,
    std_dev: parseFloat(row.std_dev) || 0,
  }));
}

/**
 * Get placement stats (Top 3 vs Bottom 3 finishes)
 * @returns {Promise<Array>} Users with their podium and relegation zone counts
 */
export async function getPlacementStats() {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position,
        COUNT(*) OVER (PARTITION BY round_id) as total_participants
      FROM user_rounds
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END) as top_3_count,
      SUM(CASE WHEN r.position >= (r.total_participants - 2) THEN 1 ELSE 0 END) as bottom_3_count,
      COUNT(r.round_id) as total_rounds
    FROM users u
    JOIN RoundRanks r ON u.id = r.user_id
    GROUP BY u.id
    ORDER BY top_3_count DESC, bottom_3_count ASC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get league comparison stats (Rounds above/below league average)
 * @returns {Promise<Array>} Users with counts of above/below average rounds
 */
export async function getLeagueComparisonStats() {
  const query = `
    WITH RoundAverages AS (
      SELECT 
        round_id,
        AVG(points) as league_avg
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY round_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN ur.points > ra.league_avg THEN 1 ELSE 0 END) as above_avg_count,
      SUM(CASE WHEN ur.points < ra.league_avg THEN 1 ELSE 0 END) as below_avg_count,
      ROUND(AVG(ur.points - ra.league_avg), 1) as avg_diff
    FROM users u
    JOIN user_rounds ur ON u.id = ur.user_id
    JOIN RoundAverages ra ON ur.round_id = ra.round_id
    WHERE ur.participated = TRUE
    GROUP BY u.id
    ORDER BY above_avg_count DESC
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    avg_diff: parseFloat(row.avg_diff) || 0,
  }));
}

/**
 * Get efficiency stats (Points per Million)
 * Uses current team value as a proxy.
 * @returns {Promise<Array>} Users sorted by ROI
 */
export async function getEfficiencyStats() {
  const query = `
    WITH UserPoints AS (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    ),
    UserValue AS (
      SELECT owner_id, SUM(price) as team_value
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      up.total_points,
      COALESCE(uv.team_value, 0) as team_value,
      -- Calculate Points per 1M value
      ROUND(CAST(up.total_points AS NUMERIC) / NULLIF((CAST(uv.team_value AS NUMERIC) / 1000000), 0), 2) as points_per_million
    FROM users u
    JOIN UserPoints up ON u.id = up.user_id
    LEFT JOIN UserValue uv ON u.id = uv.owner_id
    WHERE uv.team_value > 0
    ORDER BY points_per_million DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get streak stats (Consecutive rounds with 175+ points)
 * @returns {Promise<Array>} Users with their longest 175+ point streak
 */
export async function getStreakStats() {
  const query = `
    WITH Scores AS (
      SELECT 
        user_id, 
        round_id, 
        CASE WHEN points >= 175 THEN 1 ELSE 0 END as is_high_score
      FROM user_rounds
      WHERE participated = TRUE
    ),
    Streaks AS (
      SELECT 
        user_id,
        round_id,
        is_high_score,
        SUM(CASE WHEN is_high_score = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY user_id ORDER BY round_id) as grp
      FROM Scores
    ),
    GroupedStreaks AS (
      SELECT 
        user_id, 
        grp, 
        COUNT(*) as streak_length
      FROM Streaks
      WHERE is_high_score = 1
      GROUP BY user_id, grp
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      MAX(gs.streak_length) as longest_streak
    FROM users u
    JOIN GroupedStreaks gs ON u.id = gs.user_id
    GROUP BY u.id
    ORDER BY longest_streak DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get "Bottler" stats (High placed finishes without winning)
 * "Bottler Score" = (2nd_places * 3) + (3rd_places * 1) - (1st_places * 2)
 * High score means lots of near misses and few wins.
 * @returns {Promise<Array>} Users sorted by bottler score
 */
export async function getBottlerStats() {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) as seconds,
      SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) as thirds,
      (SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) * 3 + 
       SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) * 1) - 
       (SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) * 2)
       as bottler_score
    FROM users u
    JOIN RoundRanks r ON u.id = r.user_id
    GROUP BY u.id
    HAVING (SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) > 0)
    ORDER BY bottler_score DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get Heartbreaker stats (Total margin of defeat in 2nd place finishes)
 * @returns {Promise<Array>} Users sorted by total points missed by
 */
export async function getHeartbreakerStats() {
  const refinedQuery = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        points,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position,
        MAX(points) OVER (PARTITION BY round_id) as winner_points
      FROM user_rounds
      WHERE participated = TRUE
    ),
    HeartbreakEvents AS (
      SELECT 
        user_id,
        round_id,
        (winner_points - points) as diff
      FROM RoundRanks
      WHERE position = 2
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(he.round_id) as count,
      COALESCE(SUM(he.diff), 0) as total_diff
    FROM users u
    LEFT JOIN HeartbreakEvents he ON u.id = he.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE) -- Only active users
    GROUP BY u.id
    ORDER BY (CASE WHEN COALESCE(SUM(he.diff), 0) = 0 THEN 1 ELSE 0 END) ASC, total_diff ASC
  `;
  return (await db.query(refinedQuery)).rows;
}

/**
 * Get "No Glory" stats (Total points in non-winning rounds)
 * @returns {Promise<Array>} Users sorted by points scored without winning
 */
export async function getNoGloryStats() {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        points,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    ),
    NoGloryEvents AS (
      SELECT 
        user_id,
        points
      FROM RoundRanks
      WHERE position > 1
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(SUM(nge.points), 0) as total_points_no_glory,
      COUNT(nge.points) as rounds_count
    FROM users u
    LEFT JOIN NoGloryEvents nge ON u.id = nge.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE)
    GROUP BY u.id
    ORDER BY total_points_no_glory DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get "Jinx" stats (Above avg score but bottom half rank)
 * @returns {Promise<Array>} Users sorted by count of "jinxed" rounds
 */
export async function getJinxStats() {
  const query = `
    WITH RoundStats AS (
      SELECT 
        round_id,
        AVG(points) as league_avg,
        COUNT(user_id) as participant_count
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY round_id
    ),
    UserRoundsWithRank AS (
      SELECT 
        ur.user_id,
        ur.round_id,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE participated = TRUE
    ),
    JinxEvents AS (
      SELECT 
        urr.user_id,
        urr.round_id
      FROM UserRoundsWithRank urr
      JOIN RoundStats rs ON urr.round_id = rs.round_id
      WHERE urr.points > rs.league_avg 
        AND urr.position > (rs.participant_count / 2)
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(je.round_id) as jinxed_count
    FROM users u
    LEFT JOIN JinxEvents je ON u.id = je.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE)
    GROUP BY u.id
    ORDER BY jinxed_count DESC
  `;
  return (await db.query(query)).rows;
}
