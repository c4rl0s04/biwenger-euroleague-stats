/**
 * @fileoverview Standings query functions
 * Provides functions for fetching league standings and rankings
 */

import { db } from '../../client.js';

// Import shared type definitions for IDE support
/** @typedef {import('../../types.js').UserStanding} UserStanding */
/** @typedef {import('../../types.js').RoundWinner} RoundWinner */
/** @typedef {import('../../types.js').LeagueTotals} LeagueTotals */
/** @typedef {import('../../types.js').PointsProgression} PointsProgression */

/**
 * Get extended standings with additional statistics
 * @returns {Promise<UserStanding[]>} Full standings with wins, averages, and team values
 */
export async function getExtendedStandings() {
  const query = `
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points,
        COUNT(*) as rounds_played,
        ROUND(AVG(points), 1) as avg_points,
        MAX(points) as best_round,
        MIN(points) as worst_round
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    ),
    RoundWins AS (
      SELECT 
        user_id,
        COUNT(*) as wins
      FROM (
        SELECT 
          user_id,
          points,
          RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
        FROM user_rounds
        WHERE participated = TRUE
      ) sub
      WHERE position = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(ut.total_points, 0) as total_points,
      COALESCE(ut.rounds_played, 0) as rounds_played,
      COALESCE(ut.avg_points, 0) as avg_points,
      COALESCE(ut.best_round, 0) as best_round,
      COALESCE(ut.worst_round, 0) as worst_round,
      COALESCE(rw.wins, 0) as round_wins,
      COALESCE(sq.team_value, 0) as team_value,
      COALESCE(sq.price_trend, 0) as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC) as position
    FROM users u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN RoundWins rw ON u.id = rw.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY position ASC
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    total_points: parseInt(row.total_points) || 0,
    rounds_played: parseInt(row.rounds_played) || 0,
    avg_points: parseFloat(row.avg_points) || 0,
    best_round: parseInt(row.best_round) || 0,
    worst_round: parseInt(row.worst_round) || 0,
    round_wins: parseInt(row.round_wins) || 0,
    team_value: parseInt(row.team_value) || 0,
    price_trend: parseInt(row.price_trend) || 0,
  }));
}

/**
 * Get history of round winners
 * @param {number} [limit=15] - Number of rounds to return
 * @returns {Promise<RoundWinner[]>} Round winners history with points
 */
export async function getRoundWinners(limit = 15) {
  const query = `
    WITH RoundResults AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        u.name,
        u.icon,
        u.color_index,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.participated = TRUE
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
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows;
}

/**
 * Get aggregated league statistics
 * @returns {Promise<LeagueTotals & {most_valuable_user: Object, round_record: Object, leader_streak: number}>} League totals, averages, and records
 */
export async function getLeagueTotals() {
  const pointsQuery = `
    SELECT 
      SUM(points) as total_points,
      ROUND(AVG(points), 1) as avg_round_points,
      COUNT(DISTINCT round_id) as total_rounds,
      COUNT(DISTINCT user_id) as total_users
    FROM user_rounds
    WHERE participated = TRUE
  `;

  // Get total season rounds from matches table
  // Count unique base round names (strip "(aplazada)" suffix and duplicates)
  // Postgres replacement logic
  const seasonRoundsQuery = `
    SELECT COUNT(DISTINCT 
      CASE 
        WHEN round_name LIKE '%(aplazada)%' THEN TRIM(REPLACE(round_name, '(aplazada)', ''))
        ELSE round_name
      END
    ) as total_season_rounds
    FROM matches
  `;

  const valueQuery = `
    SELECT 
      SUM(sq.team_value) as total_league_value,
      MAX(sq.team_value) as max_team_value,
      MIN(sq.team_value) as min_team_value
    FROM (
      SELECT owner_id, SUM(price) as team_value
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq
  `;

  const mostValuableQuery = `
    SELECT 
      u.name,
      u.icon,
      u.color_index,
      SUM(p.price) as team_value
    FROM players p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id, u.name, u.icon, u.color_index
    ORDER BY team_value DESC
    LIMIT 1
  `;

  const [pointsStats, seasonRounds, valueStats, mostValuable] = await Promise.all([
    db.query(pointsQuery).then((res) => res.rows[0]),
    db.query(seasonRoundsQuery).then((res) => res.rows[0]),
    db.query(valueQuery).then((res) => res.rows[0]),
    db.query(mostValuableQuery).then((res) => res.rows[0]),
  ]);

  // Record for most points in a single round
  const roundRecordQuery = `
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      u.color_index,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const roundRecord = (await db.query(roundRecordQuery)).rows[0];

  // Leader streak - count consecutive rounds where current leader was #1
  const leaderStreakQuery = `
    WITH CurrentLeader AS (
      SELECT user_id
      FROM (
        SELECT user_id, SUM(points) as total
        FROM user_rounds
        WHERE participated = TRUE
        GROUP BY user_id
        ORDER BY total DESC
        LIMIT 1
      ) sub
    ),
    LeagueRounds AS (
      SELECT DISTINCT round_id 
      FROM user_rounds 
      WHERE participated = TRUE
    ),
    RoundRanks AS (
      SELECT 
        round_id,
        user_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    ),
    LeaderPerformance AS (
      SELECT 
        lr.round_id,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM RoundRanks rr 
            WHERE rr.round_id = lr.round_id 
            AND rr.user_id = (SELECT user_id FROM CurrentLeader)
            AND rr.position = 1
          ) THEN 1 
          ELSE 0 
        END as is_win
      FROM LeagueRounds lr
    ),
    CalculatedStreak AS (
      SELECT 
        round_id,
        is_win,
        SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) OVER (ORDER BY round_id DESC) as grp
      FROM LeaderPerformance
    )
    SELECT COUNT(*) as streak
    FROM CalculatedStreak
    WHERE grp = 0 AND is_win = 1
  `;

  let leaderStreak = { streak: 0 };
  try {
    const res = await db.query(leaderStreakQuery);
    leaderStreak = res.rows[0] || { streak: 0 };
  } catch (e) {
    // Fallback if query fails
    console.error('Leader Streak Query Error', e);
  }

  return {
    ...pointsStats,
    ...valueStats,
    total_points: parseInt(pointsStats?.total_points) || 0,
    avg_round_points: parseFloat(pointsStats?.avg_round_points) || 0,
    total_rounds: parseInt(pointsStats?.total_rounds) || 0,
    total_users: parseInt(pointsStats?.total_users) || 0,
    total_league_value: parseInt(valueStats?.total_league_value) || 0,
    max_team_value: parseInt(valueStats?.max_team_value) || 0,
    min_team_value: parseInt(valueStats?.min_team_value) || 0,
    total_season_rounds: parseInt(seasonRounds?.total_season_rounds) || 34,
    most_valuable_user: mostValuable
      ? {
          ...mostValuable,
          team_value: parseInt(mostValuable.team_value) || 0,
        }
      : null,
    round_record: roundRecord,
    leader_streak: parseInt(leaderStreak?.streak) || 0,
  };
}

/**
 * Get points progression for all users across rounds
 * @param {number} [limit=10] - Number of most recent rounds
 * @returns {Promise<PointsProgression[]>} Points by round for each user with cumulative totals
 */
export async function getPointsProgression(limit = 10) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM user_rounds
      ORDER BY round_id DESC
      LIMIT $1
    )
    SELECT 
      ur.user_id,
      u.name,
      u.color_index,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id) as cumulative_points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    ORDER BY ur.round_id ASC, ur.points DESC
  `;
  return (await db.query(query, [limit])).rows.map((row) => ({
    ...row,
    cumulative_points: parseInt(row.cumulative_points) || 0,
  }));
}

/**
 * Get users ranked by team value
 * @returns {Promise<{user_id: number, name: string, icon: string, team_value: number, price_trend: number, squad_size: number, value_position: number}[]>} Users sorted by squad value
 */
export async function getValueRanking() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(SUM(p.price), 0) as team_value,
      COALESCE(SUM(p.price_increment), 0) as price_trend,
      COUNT(p.id) as squad_size,
      RANK() OVER (ORDER BY COALESCE(SUM(p.price), 0) DESC) as value_position
    FROM users u
    LEFT JOIN players p ON u.id = p.owner_id
    GROUP BY u.id
    ORDER BY team_value DESC
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    team_value: parseInt(row.team_value) || 0,
    price_trend: parseInt(row.price_trend) || 0,
    squad_size: parseInt(row.squad_size) || 0,
  }));
}

/**
 * Get win count per user
 * @returns {Promise<{user_id: number, name: string, icon: string, wins: number}[]>} Users with their round win counts
 */
export async function getWinCounts() {
  const query = `
    WITH RoundWinners AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(rw.round_id) as wins
    FROM users u
    LEFT JOIN RoundWinners rw ON u.id = rw.user_id AND rw.position = 1
    GROUP BY u.id
    ORDER BY wins DESC
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    wins: parseInt(row.wins) || 0,
  }));
}

/**
 * Get league standings (Simple version from legacy stats.js)
 * RENAMED to avoid conflict, but kept for compatibility during refactor
 * @returns {Promise<Array>} Current standings with user details
 */
export async function getSimpleStandings() {
  const query = `
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(ut.total_points, 0) as total_points,
      COALESCE(sq.team_value, 0) as team_value,
      COALESCE(sq.price_trend, 0) as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC) as position
    FROM users u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY position ASC
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    total_points: parseInt(row.total_points) || 0,
    team_value: parseInt(row.team_value) || 0,
    price_trend: parseInt(row.price_trend) || 0,
  }));
}

/**
 * Get comparison with league leader
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Leader comparison
 */
export async function getLeaderComparison(userId) {
  // Use the extended standings for better data, or simple if sufficient. 
  // Original Used getStandings (Simple). Let's use getSimpleStandings here to match logic exactly.
  const standings = await getSimpleStandings();
  const leader = standings[0];
  const secondPlace = standings[1];
  // Ensure we compare strings properly if IDs are mixed types in DB/JS
  const user = standings.find((u) => String(u.user_id) === String(userId));

  if (!user || !leader) return null;

  const gap = leader.total_points - user.total_points;
  // If user.position is string (e.g. from bigInt), convert. But here it's from RANK so it's number/string.
  const pos = parseInt(user.position);
  const roundsNeeded = pos > 1 ? Math.ceil(gap / 10) : 0;

  const gapToSecond = pos === 1 && secondPlace ? user.total_points - secondPlace.total_points : 0;

  return {
    leader_name: leader.name,
    leader_points: leader.total_points,
    user_points: user.total_points,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: pos === 1,
  };
}

/**
 * Get league average points per round
 * @returns {Promise<number>} Average points
 */
export async function getLeagueAveragePoints() {
  const query = `
    SELECT ROUND(AVG(points), 1) as avg_points
    FROM user_rounds
    WHERE participated = TRUE
  `;

  const result = (await db.query(query)).rows[0];
  return result ? parseFloat(result.avg_points) : 0;
}

