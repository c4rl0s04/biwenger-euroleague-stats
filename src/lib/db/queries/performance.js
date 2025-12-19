import { db } from '../client.js';

/**
 * Get volatility stats (Standard Deviation of points)
 * @returns {Array} Users sorted by consistency (lower std_dev is better)
 */
export function getVolatilityStats() {
  const query = `
    WITH Stats AS (
      SELECT 
        user_id,
        AVG(points) as avg_points,
        -- SQLite doesn't have a native STDEV function in older versions, 
        -- so we calculate it manually: SQRT(AVG(points*points) - AVG(points)*AVG(points))
        -- Or using the extension if available, but manual is safer here.
        SQRT(AVG(points*points) - AVG(points)*AVG(points)) as std_dev
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      ROUND(s.avg_points, 1) as avg_points,
      ROUND(s.std_dev, 2) as std_dev
    FROM users u
    JOIN Stats s ON u.id = s.user_id
    ORDER BY s.std_dev ASC
  `;
  return db.prepare(query).all();
}

/**
 * Get placement stats (Top 3 vs Bottom 3 finishes)
 * @returns {Array} Users with their podium and relegation zone counts
 */
export function getPlacementStats() {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position,
        COUNT(*) OVER (PARTITION BY round_id) as total_participants
      FROM user_rounds
      WHERE participated = 1
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END) as top_3_count,
      SUM(CASE WHEN r.position >= (r.total_participants - 2) THEN 1 ELSE 0 END) as bottom_3_count,
      COUNT(r.round_id) as total_rounds
    FROM users u
    JOIN RoundRanks r ON u.id = r.user_id
    GROUP BY u.id
    ORDER BY top_3_count DESC, bottom_3_count ASC
  `;
  return db.prepare(query).all();
}

/**
 * Get league comparison stats (Rounds above/below league average)
 * @returns {Array} Users with counts of above/below average rounds
 */
export function getLeagueComparisonStats() {
  const query = `
    WITH RoundAverages AS (
      SELECT 
        round_id,
        AVG(points) as league_avg
      FROM user_rounds
      WHERE participated = 1
      GROUP BY round_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      SUM(CASE WHEN ur.points > ra.league_avg THEN 1 ELSE 0 END) as above_avg_count,
      SUM(CASE WHEN ur.points < ra.league_avg THEN 1 ELSE 0 END) as below_avg_count,
      ROUND(AVG(ur.points - ra.league_avg), 1) as avg_diff
    FROM users u
    JOIN user_rounds ur ON u.id = ur.user_id
    JOIN RoundAverages ra ON ur.round_id = ra.round_id
    WHERE ur.participated = 1
    GROUP BY u.id
    ORDER BY above_avg_count DESC
  `;
  return db.prepare(query).all();
}

/**
 * Get efficiency stats (Points per Million)
 * Uses current team value as a proxy.
 * @returns {Array} Users sorted by ROI
 */
export function getEfficiencyStats() {
  const query = `
    WITH UserPoints AS (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
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
      up.total_points,
      COALESCE(uv.team_value, 0) as team_value,
      -- Calculate Points per 1M value
      ROUND(CAST(up.total_points AS FLOAT) / (CAST(uv.team_value AS FLOAT) / 1000000), 2) as points_per_million
    FROM users u
    JOIN UserPoints up ON u.id = up.user_id
    LEFT JOIN UserValue uv ON u.id = uv.owner_id
    WHERE uv.team_value > 0
    ORDER BY points_per_million DESC
  `;
  return db.prepare(query).all();
}

/**
 * Get streak stats (Consecutive rounds with 50+ points)
 * @returns {Array} Users with their longest 50+ point streak
 */
export function getStreakStats() {
  const query = `
    WITH Scores AS (
      SELECT 
        user_id, 
        round_id, 
        CASE WHEN points >= 50 THEN 1 ELSE 0 END as is_high_score
      FROM user_rounds
      WHERE participated = 1
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
      MAX(gs.streak_length) as longest_streak
    FROM users u
    JOIN GroupedStreaks gs ON u.id = gs.user_id
    GROUP BY u.id
    ORDER BY longest_streak DESC
  `;
  return db.prepare(query).all();
}

/**
 * Get "Bottler" stats (High placed finishes without winning)
 * "Bottler Score" = (2nd_places * 3) + (3rd_places * 1) - (1st_places * 2)
 * High score means lots of near misses and few wins.
 * @returns {Array} Users sorted by bottler score
 */
export function getBottlerStats() {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = 1
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
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
    HAVING (seconds > 0 OR thirds > 0)
    ORDER BY bottler_score DESC
  `;
  return db.prepare(query).all();
}
