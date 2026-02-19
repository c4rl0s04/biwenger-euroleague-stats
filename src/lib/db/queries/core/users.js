/**
 * @fileoverview User query functions
 * Provides functions for fetching user data, squads, and personalized stats
 */

import { db } from '../../client';
import { getSimpleStandings as getStandings } from '../competition/standings';

// Import shared type definitions for IDE support
/** @typedef {import('../../types.js').User} User */
/** @typedef {import('../../types.js').Player} Player */
/** @typedef {import('../../types.js').UserSeasonStats} UserSeasonStats */

/**
 * Get all users with their basic info
 * @returns {Promise<{id: number, name: string, icon: string}[]>} List of users
 */
export async function getAllUsers() {
  return (await db.query('SELECT id, name, icon, color_index FROM users ORDER BY name ASC')).rows;
}

/**
 * Get squad statistics for all users
 * @returns {Promise<{user_id: number, squad_size: number, total_value: number, total_points: number}[]>} Squad stats per user
 */
export async function getSquadStats() {
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
      WHERE participated = TRUE
      GROUP BY user_id
    ) ur ON p.owner_id = ur.user_id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id, ur.total_points
    ORDER BY total_points DESC
  `;

  return (await db.query(query)).rows.map((row) => ({
    ...row,
    squad_size: parseInt(row.squad_size) || 0,
    total_value: parseInt(row.total_value) || 0,
    total_points: parseInt(row.total_points) || 0,
  }));
}

/**
 * Get user squad details (Current Squad)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Player details
 */
export async function getUserSquad(userId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      t.name as team,
      p.price,
      p.puntos as points,
      ROUND(CAST(p.puntos AS NUMERIC) / NULLIF(p.partidos_jugados, 0), 1) as average,
      p.status
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
    ORDER BY p.puntos DESC
  `;

  return (await db.query(query, [userId])).rows.map((row) => ({
    ...row,
    average: parseFloat(row.average) || 0,
    points: parseInt(row.points) || 0,
    price: parseInt(row.price) || 0,
  }));
}

/**
 * Get detailed season statistics for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User season statistics
 */
export async function getUserSeasonStats(userId) {
  // First get user details for name
  const userRes = await db.query('SELECT name, color_index FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];

  const statsQuery = `
    WITH UserRounds AS (
      SELECT 
        user_id,
        points,
        participated
      FROM user_rounds
      WHERE user_id = $1 AND participated = TRUE
    )
    SELECT 
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(MAX(points), 0) as best_round,
      COALESCE(MIN(points), 0) as worst_round,
      COALESCE(ROUND(AVG(points), 1), 0) as average_points,
      COUNT(*) as rounds_played
    FROM UserRounds
  `;

  const statsRes = await db.query(statsQuery, [userId]);
  const stats = statsRes.rows[0];

  const positionsQuery = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = TRUE
    )
    SELECT 
      MIN(position) as best_position,
      MAX(position) as worst_position,
      ROUND(AVG(position), 1) as average_position,
      COUNT(CASE WHEN position = 1 THEN 1 END) as victories,
      COUNT(CASE WHEN position <= 3 THEN 1 END) as podiums
    FROM RoundPositions
    WHERE user_id = $1
  `;

  // Transfers query
  const transfersQuery = `
    SELECT
      COUNT(CASE WHEN comprador = $1 THEN 1 END) as purchases,
      COUNT(CASE WHEN vendedor = $2 THEN 1 END) as sales
    FROM fichajes
  `;

  const positionsRes = await db.query(positionsQuery, [userId]);
  const positions = positionsRes.rows[0];

  let transfers = { purchases: 0, sales: 0 };
  if (user) {
    const transfersRes = await db.query(transfersQuery, [user.name, user.name]); // using names as per schema
    transfers = transfersRes.rows[0] || transfers;
  }

  const standings = await getStandings();
  // Ensure ID type comparison safety
  const userStanding = standings.find((u) => String(u.user_id) === String(userId));

  return {
    name: user?.name || 'Desconocido',
    color_index: user?.color_index ?? 0,

    // Stats Parsing
    total_points: parseInt(stats?.total_points) || 0,
    best_round: parseInt(stats?.best_round) || 0,
    worst_round: parseInt(stats?.worst_round) || 0,
    average_points: parseFloat(stats?.average_points) || 0,
    rounds_played: parseInt(stats?.rounds_played) || 0,

    // Positions Parsing
    best_position: parseInt(positions?.best_position) || 0,
    worst_position: parseInt(positions?.worst_position) || 0,
    average_position: parseFloat(positions?.average_position) || 0,
    victories: parseInt(positions?.victories) || 0,
    podiums: parseInt(positions?.podiums) || 0,

    // Transfers Parsing
    purchases: parseInt(transfers?.purchases) || 0,
    sales: parseInt(transfers?.sales) || 0,

    position: userStanding?.position || 0,
    team_value: userStanding?.team_value || 0,
    price_trend: userStanding?.price_trend || 0,
  };
}

/**
 * Get user's squad with price trends
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Squad details with trending players
 */
export async function getUserSquadDetails(userId) {
  const squadQuery = `
    SELECT 
      p.id, p.name, p.position, t.name as team, p.price, p.price_increment, p.puntos as points
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
    ORDER BY price_increment DESC
  `;

  const squadRes = await db.query(squadQuery, [userId]);
  const squad = squadRes.rows;

  // Get user's actual competition points from user_rounds
  const userPointsQuery = `
    SELECT COALESCE(SUM(points), 0) as total_points
    FROM user_rounds
    WHERE user_id = $1 AND participated = TRUE
  `;
  const userPointsRes = await db.query(userPointsQuery, [userId]);
  const userPoints = userPointsRes.rows[0];

  // Convert to numbers explicitly to assume safety
  const totalValue = squad.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0);
  const totalTrend = squad.reduce((sum, p) => sum + (parseInt(p.price_increment) || 0), 0);

  return {
    total_value: totalValue,
    price_trend: totalTrend,
    total_points: userPoints?.total_points || 0,
    player_count: squad.length,
    top_rising: squad.filter((p) => (parseInt(p.price_increment) || 0) > 0).slice(0, 7),
    top_falling: squad
      .filter((p) => (parseInt(p.price_increment) || 0) < 0)
      .slice(-7)
      .reverse(),
  };
}

/**
 * Get user's captain statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Captain stats
 */
export async function getUserCaptainStats(userId) {
  const overallQuery = `
    SELECT 
      COUNT(DISTINCT l.round_id) as total_rounds,
      SUM(COALESCE(prs.fantasy_points, 0)) as extra_points,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
  `;
  const overallRes = await db.query(overallQuery, [userId]);
  const overall = overallRes.rows[0];

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
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    GROUP BY l.player_id, p.id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
  `;
  const mostUsedRes = await db.query(mostUsedQuery, [userId]);
  const mostUsed = mostUsedRes.rows;

  const bestQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points DESC
    LIMIT 1
  `;
  const bestRes = await db.query(bestQuery, [userId]);
  const best = bestRes.rows[0];

  const worstQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points ASC
    LIMIT 1
  `;
  const worstRes = await db.query(worstQuery, [userId]);
  const worst = worstRes.rows[0];

  return {
    total_rounds: overall ? parseInt(overall.total_rounds) : 0,
    extra_points: overall ? parseInt(overall.extra_points) : 0,
    avg_points: overall ? parseFloat(overall.avg_points) : 0,
    most_used: mostUsed.map((m) => ({
      ...m,
      avg_as_captain: parseFloat(m.avg_as_captain) || 0,
    })),
    best_round: best ? { name: best.name, points: best.points } : { name: '', points: 0 },
    worst_round: worst ? { name: worst.name, points: worst.points } : { name: '', points: 0 },
  };
}

/**
 * Get user's home/away performance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Home/away stats
 */
export async function getUserHomeAwayStats(userId) {
  const query = `
    SELECT 
      SUM(points_home) as total_home,
      SUM(points_away) as total_away,
      SUM(played_home) as games_home,
      SUM(played_away) as games_away
    FROM players
    WHERE owner_id = $1
  `;

  const statsRes = await db.query(query, [userId]);
  const stats = statsRes.rows[0];

  // Safely parse
  const totalHome = parseInt(stats.total_home) || 0;
  const totalAway = parseInt(stats.total_away) || 0;
  const gamesHome = parseInt(stats.games_home) || 0;
  const gamesAway = parseInt(stats.games_away) || 0;

  return {
    total_home: totalHome,
    total_away: totalAway,
    avg_home: gamesHome > 0 ? Math.round(totalHome / gamesHome) : 0,
    avg_away: gamesAway > 0 ? Math.round(totalAway / gamesAway) : 0,
    difference_pct:
      totalHome > 0 && totalAway > 0 ? Math.round(((totalHome - totalAway) / totalAway) * 100) : 0,
  };
}

/**
 * Get captain recommendations based on form and upcoming matches
 * @param {string} userId - User ID to get recommendations for
 * @param {number} limit - Number of recommendations
 * @returns {Promise<Array>} List of recommended captain picks
 */
export async function getCaptainRecommendations(userId, limit = 3) {
  const query = `
    WITH FinishedRounds AS (
      SELECT m.round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT 3
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM FinishedRounds
    ),
    UserSquadForm AS (
      SELECT 
        p.id as player_id,
        p.name,
        p.position,
        t.id as team_id,
        t.name as team,
        COALESCE(ps.total_points, 0) * 1.0 / (SELECT total_rounds FROM RoundCount) as avg_recent_points,
        COALESCE(ps.games_played, 0) as recent_games,
        ps.recent_scores
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN (
        SELECT 
          player_id, 
          STRING_AGG(CAST(fantasy_points AS TEXT), ',') as recent_scores,
          SUM(fantasy_points) as total_points,
          COUNT(*) as games_played
        FROM (
          SELECT player_id, fantasy_points
          FROM player_round_stats
          WHERE round_id IN (SELECT round_id FROM FinishedRounds)
          ORDER BY round_id DESC
        ) sub
        GROUP BY player_id
      ) ps ON p.id = ps.player_id
      WHERE p.owner_id = $1
    )
    SELECT 
      player_id,
      name,
      position,
      team_id,
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
    LIMIT $2
  `;

  return (await db.query(query, [userId, limit])).rows;
}

/**
 * Get personalized alerts for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of alerts
 * @returns {Promise<Array>} Personalized alerts
 */
export async function getPersonalizedAlerts(userId, limit = 5) {
  const alerts = [];

  const priceGainsQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = $1 AND price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceGains = (await db.query(priceGainsQuery, [userId])).rows;
  priceGains.forEach((player) => {
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(parseInt(player.price_increment) / 1000000).toFixed(2)}M€`,
      severity: 'success',
    });
  });

  const priceLossesQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = $1 AND price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const priceLosses = (await db.query(priceLossesQuery, [userId])).rows;
  priceLosses.forEach((player) => {
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(parseInt(player.price_increment) / 1000000).toFixed(2)}M€`,
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
    WHERE p.owner_id = $1 
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodForm = (await db.query(recentGoodFormQuery, [userId])).rows[0];
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
