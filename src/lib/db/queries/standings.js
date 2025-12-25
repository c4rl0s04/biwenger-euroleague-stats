/**
 * @fileoverview Standings query functions
 * Provides functions for fetching league standings and rankings
 */

import { db } from '../client.js';

// Import shared type definitions for IDE support
/** @typedef {import('../types.js').UserStanding} UserStanding */
/** @typedef {import('../types.js').RoundWinner} RoundWinner */
/** @typedef {import('../types.js').LeagueTotals} LeagueTotals */
/** @typedef {import('../types.js').PointsProgression} PointsProgression */

/**
 * Get extended standings with additional statistics
 * @returns {UserStanding[]} Full standings with wins, averages, and team values
 */
export function getExtendedStandings() {
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
      WHERE participated = 1
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
        WHERE participated = 1
      )
      WHERE position = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
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
  return db.prepare(query).all();
}

/**
 * Get history of round winners
 * @param {number} [limit=15] - Number of rounds to return
 * @returns {RoundWinner[]} Round winners history with points
 */
export function getRoundWinners(limit = 15) {
  const query = `
    WITH RoundResults AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        u.name,
        u.icon,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.participated = 1
    )
    SELECT 
      round_id,
      round_name,
      user_id,
      name,
      icon,
      points
    FROM RoundResults
    WHERE position = 1
    ORDER BY round_id DESC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get aggregated league statistics
 * @returns {LeagueTotals & {most_valuable_user: Object, round_record: Object, leader_streak: number}} League totals, averages, and records
 */
export function getLeagueTotals() {
  const pointsQuery = `
    SELECT 
      SUM(points) as total_points,
      ROUND(AVG(points), 1) as avg_round_points,
      COUNT(DISTINCT round_id) as total_rounds,
      COUNT(DISTINCT user_id) as total_users
    FROM user_rounds
    WHERE participated = 1
  `;

  // Get total season rounds from matches table
  // Count unique base round names (strip "(aplazada)" suffix and duplicates)
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
      SUM(p.price) as team_value
    FROM players p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id
    ORDER BY team_value DESC
    LIMIT 1
  `;

  const pointsStats = db.prepare(pointsQuery).get();
  const seasonRounds = db.prepare(seasonRoundsQuery).get();
  const valueStats = db.prepare(valueQuery).get();
  const mostValuable = db.prepare(mostValuableQuery).get();

  // Record for most points in a single round
  const roundRecordQuery = `
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.participated = 1
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const roundRecord = db.prepare(roundRecordQuery).get();

  // Leader streak - count consecutive rounds where current leader was #1
  const leaderStreakQuery = `
    WITH RankedRounds AS (
      SELECT 
        round_id,
        user_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = 1
    ),
    CurrentLeader AS (
      SELECT user_id
      FROM (
        SELECT user_id, SUM(points) as total
        FROM user_rounds
        WHERE participated = 1
        GROUP BY user_id
        ORDER BY total DESC
        LIMIT 1
      )
    ),
    LeaderHistory AS (
      SELECT 
        rr.round_id,
        rr.user_id,
        rr.position,
        CASE WHEN rr.user_id = (SELECT user_id FROM CurrentLeader) AND rr.position = 1 THEN 1 ELSE 0 END as is_leader_win
      FROM RankedRounds rr
      ORDER BY round_id DESC
    )
    SELECT COUNT(*) as streak
    FROM (
      SELECT round_id, is_leader_win,
        SUM(CASE WHEN is_leader_win = 0 THEN 1 ELSE 0 END) OVER (ORDER BY round_id DESC) as grp
      FROM LeaderHistory
    )
    WHERE grp = 0
  `;

  let leaderStreak = { streak: 0 };
  try {
    leaderStreak = db.prepare(leaderStreakQuery).get() || { streak: 0 };
  } catch (e) {
    // Fallback if query fails
  }

  return {
    ...pointsStats,
    ...valueStats,
    total_season_rounds: seasonRounds?.total_season_rounds || 34,
    most_valuable_user: mostValuable,
    round_record: roundRecord,
    leader_streak: leaderStreak.streak || 0,
  };
}

/**
 * Get points progression for all users across rounds
 * @param {number} [limit=10] - Number of most recent rounds
 * @returns {PointsProgression[]} Points by round for each user with cumulative totals
 */
export function getPointsProgression(limit = 10) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM user_rounds
      ORDER BY round_id DESC
      LIMIT ?
    )
    SELECT 
      ur.user_id,
      u.name,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = 1 THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = 1 THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id) as cumulative_points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    ORDER BY ur.round_id ASC, ur.points DESC
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get users ranked by team value
 * @returns {{user_id: number, name: string, icon: string, team_value: number, price_trend: number, squad_size: number, value_position: number}[]} Users sorted by squad value
 */
export function getValueRanking() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      COALESCE(SUM(p.price), 0) as team_value,
      COALESCE(SUM(p.price_increment), 0) as price_trend,
      COUNT(p.id) as squad_size,
      RANK() OVER (ORDER BY COALESCE(SUM(p.price), 0) DESC) as value_position
    FROM users u
    LEFT JOIN players p ON u.id = p.owner_id
    GROUP BY u.id
    ORDER BY team_value DESC
  `;
  return db.prepare(query).all();
}

/**
 * Get win count per user
 * @returns {{user_id: number, name: string, icon: string, wins: number}[]} Users with their round win counts
 */
export function getWinCounts() {
  const query = `
    WITH RoundWinners AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = 1
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      COUNT(rw.round_id) as wins
    FROM users u
    LEFT JOIN RoundWinners rw ON u.id = rw.user_id AND rw.position = 1
    GROUP BY u.id
    ORDER BY wins DESC
  `;
  return db.prepare(query).all();
}
