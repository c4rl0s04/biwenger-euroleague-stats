/**
 * @fileoverview User query functions
 * Provides functions for fetching user data, squads, and personalized stats
 */

import { db } from '../client.js';
import { getStandings } from './stats.js';

// Import shared type definitions for IDE support
/** @typedef {import('../types.js').User} User */
/** @typedef {import('../types.js').Player} Player */
/** @typedef {import('../types.js').UserSeasonStats} UserSeasonStats */

/**
 * Get squad statistics for all users
 * @returns {{user_id: number, squad_size: number, total_value: number, total_points: number}[]} Squad stats per user
 */
export function getSquadStats() {
  const query = `
    SELECT 
      p.owner_id as user_id,
      COUNT(p.id) as squad_size,
      SUM(COALESCE(p.price, 0)) as total_value,
      ur.total_points
    FROM players p
    LEFT JOIN (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    ) ur ON p.owner_id = ur.user_id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id
    ORDER BY total_points DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get user squad details (Current Squad)
 * @param {number} userId - User ID
 * @returns {Array} Player details
 */
export function getUserSquad(userId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      p.team,
      p.price,
      p.puntos as points,
      ROUND(CAST(p.puntos AS FLOAT) / NULLIF(p.partidos_jugados, 0), 1) as average,
      p.status
    FROM players p
    WHERE p.owner_id = ?
    ORDER BY p.puntos DESC
  `;

  return db.prepare(query).all(userId);
}

/**
 * Get detailed season statistics for a specific user
 * @param {string} userId - User ID
 * @returns {Object} User season statistics
 */
export function getUserSeasonStats(userId) {
  const statsQuery = `
    WITH UserRounds AS (
      SELECT 
        user_id,
        points,
        participated
      FROM user_rounds
      WHERE user_id = ? AND participated = 1
    )
    SELECT 
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(MAX(points), 0) as best_round,
      COALESCE(MIN(points), 0) as worst_round,
      COALESCE(ROUND(AVG(points), 1), 0) as average_points,
      COUNT(*) as rounds_played
    FROM UserRounds
  `;

  const stats = db.prepare(statsQuery).get(userId);

  const positionsQuery = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = 1
    )
    SELECT 
      MIN(position) as best_position,
      MAX(position) as worst_position
    FROM RoundPositions
    WHERE user_id = ?
  `;

  const positions = db.prepare(positionsQuery).get(userId);
  const standings = getStandings();
  const userStanding = standings.find((u) => u.user_id === userId);

  return {
    ...stats,
    ...positions,
    position: userStanding?.position || 0,
    team_value: userStanding?.team_value || 0,
    price_trend: userStanding?.price_trend || 0,
  };
}

/**
 * Get user's squad with price trends
 * @param {string} userId - User ID
 * @returns {Object} Squad details with trending players
 */
export function getUserSquadDetails(userId) {
  const query = `
    SELECT 
      id, name, position, team, price, price_increment, puntos as points
    FROM players
    WHERE owner_id = ?
    ORDER BY price_increment DESC
  `;

  const squad = db.prepare(query).all(userId);

  const totalValue = squad.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalTrend = squad.reduce((sum, p) => sum + (p.price_increment || 0), 0);

  return {
    total_value: totalValue,
    price_trend: totalTrend,
    top_rising: squad.filter((p) => p.price_increment > 0).slice(0, 3),
    top_falling: squad
      .filter((p) => p.price_increment < 0)
      .slice(-3)
      .reverse(),
  };
}

/**
 * Get user's captain statistics
 * @param {string} userId - User ID
 * @returns {Object} Captain stats
 */
export function getUserCaptainStats(userId) {
  const overallQuery = `
    SELECT 
      COUNT(DISTINCT l.round_id) as total_rounds,
      SUM(COALESCE(prs.fantasy_points, 0)) as extra_points,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
  `;

  const overall = db.prepare(overallQuery).get(userId);

  const mostUsedQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      COUNT(DISTINCT l.round_id) as times_captain,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_as_captain,
      SUM(COALESCE(prs.fantasy_points, 0)) as total_as_captain
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    GROUP BY l.player_id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
  `;

  const mostUsed = db.prepare(mostUsedQuery).all(userId);

  const bestQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    ORDER BY points DESC
    LIMIT 1
  `;

  const worstQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    ORDER BY points ASC
    LIMIT 1
  `;

  const best = db.prepare(bestQuery).get(userId);
  const worst = db.prepare(worstQuery).get(userId);

  return {
    total_rounds: overall.total_rounds || 0,
    extra_points: overall.extra_points || 0,
    avg_points: overall.avg_points || 0,
    most_used: mostUsed,
    best_round: best ? { name: best.name, points: best.points } : { name: '', points: 0 },
    worst_round: worst ? { name: worst.name, points: worst.points } : { name: '', points: 0 },
  };
}

/**
 * Get user's home/away performance
 * @param {string} userId - User ID
 * @returns {Object} Home/away stats
 */
export function getUserHomeAwayStats(userId) {
  const query = `
    SELECT 
      SUM(points_home) as total_home,
      SUM(points_away) as total_away,
      SUM(played_home) as games_home,
      SUM(played_away) as games_away
    FROM players
    WHERE owner_id = ?
  `;

  const stats = db.prepare(query).get(userId);

  return {
    total_home: stats.total_home || 0,
    total_away: stats.total_away || 0,
    avg_home: stats.games_home > 0 ? Math.round(stats.total_home / stats.games_home) : 0,
    avg_away: stats.games_away > 0 ? Math.round(stats.total_away / stats.games_away) : 0,
    difference_pct:
      stats.total_home > 0 && stats.total_away > 0
        ? Math.round(((stats.total_home - stats.total_away) / stats.total_away) * 100)
        : 0,
  };
}

/**
 * Get captain recommendations based on form and upcoming matches
 * @param {string} userId - User ID to get recommendations for
 * @param {number} limit - Number of recommendations
 * @returns {Array} List of recommended captain picks
 */
export function getCaptainRecommendations(userId, limit = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT m.round_id
      FROM matches m
      WHERE m.status = 'finished'
      ORDER BY m.round_id DESC
      LIMIT 3
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    UserSquadForm AS (
      SELECT 
        p.id as player_id,
        p.name,
        p.position,
        p.team,
        COALESCE(ps.total_points, 0) * 1.0 / (SELECT total_rounds FROM RoundCount) as avg_recent_points,
        COALESCE(ps.games_played, 0) as recent_games,
        ps.recent_scores
      FROM players p
      LEFT JOIN (
        SELECT 
          player_id, 
          GROUP_CONCAT(fantasy_points) as recent_scores,
          SUM(fantasy_points) as total_points,
          COUNT(*) as games_played
        FROM (
          SELECT player_id, fantasy_points
          FROM player_round_stats
          WHERE round_id IN (SELECT round_id FROM RecentRounds)
          ORDER BY round_id DESC
        )
        GROUP BY player_id
      ) ps ON p.id = ps.player_id
      WHERE p.owner_id = ?
    )
    SELECT 
      player_id,
      name,
      position,
      team,
      avg_recent_points,
      recent_games,
      recent_scores,
      CASE 
        WHEN avg_recent_points >= 25 THEN 'Excelente forma'
        WHEN avg_recent_points >= 18 THEN 'Buena forma'
        WHEN avg_recent_points >= 12 THEN 'Forma regular'
        ELSE 'Forma baja'
      END as form_label
    FROM UserSquadForm
    WHERE avg_recent_points > 0
    ORDER BY avg_recent_points DESC
    LIMIT ?
  `;

  return db.prepare(query).all(userId, limit);
}

/**
 * Get personalized alerts for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of alerts
 * @returns {Array} Personalized alerts
 */
export function getPersonalizedAlerts(userId, limit = 5) {
  const alerts = [];

  const priceGainsQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = ? AND price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceGains = db.prepare(priceGainsQuery).all(userId);
  priceGains.forEach((player) => {
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(player.price_increment / 1000000).toFixed(2)}M€`,
      severity: 'success',
    });
  });

  const priceLossesQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = ? AND price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const priceLosses = db.prepare(priceLossesQuery).all(userId);
  priceLosses.forEach((player) => {
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(player.price_increment / 1000000).toFixed(2)}M€`,
      severity: 'warning',
    });
  });

  const recentGoodFormQuery = `
    WITH LastRound AS (
      SELECT MAX(round_id) as max_round
      FROM player_round_stats
    )
    SELECT 
      p.name,
      prs.fantasy_points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    WHERE p.owner_id = ? 
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodForm = db.prepare(recentGoodFormQuery).get(userId);
  if (goodForm) {
    alerts.push({
      type: 'good_performance',
      icon: '⭐',
      message: `¡${goodForm.name} brilló con ${goodForm.fantasy_points} puntos!`,
      severity: 'info',
    });
  }

  return alerts.slice(0, limit);
}
