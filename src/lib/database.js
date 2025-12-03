
/**
 * Database access layer using better-sqlite3
 *
 * This module provides functions to query the SQLite database
 * that was created by the Python scraper.
 */

import Database from 'better-sqlite3';

// Connect to the LOCAL database
const dbPath = process.env.DB_PATH || 'data/local.db';
const db = new Database(dbPath, { readonly: false }); // Allow writes for sync

/**
 * Get Market KPIs
 * @returns {Object} Market statistics
 */
export function getMarketKPIs() {
  const query = `
    SELECT 
      COUNT(*) as total_transfers,
      ROUND(AVG(precio), 2) as avg_value,
      MAX(precio) as max_value,
      MIN(precio) as min_value,
      COUNT(DISTINCT comprador) as active_buyers,
      COUNT(DISTINCT vendedor) as active_sellers
    FROM fichajes
  `;
  
  return db.prepare(query).get();
}

/**
 * Get all transfers with pagination
 * @param {number} limit - Number of results
 * @param {number} offset - Offset for pagination
 * @returns {Array} List of transfers
 */
export function getAllTransfers(limit = 100, offset = 0) {
  const query = `
    SELECT 
      id,
      fecha,
      player_id,
      precio,
      vendedor,
      comprador
    FROM fichajes
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;
  
  return db.prepare(query).all(limit, offset);
}

/**
 * Get Porras statistics
 * @returns {Array} User statistics from prediction game
 */
export function getPorrasStats() {
  const query = `
    SELECT 
      usuario,
      COUNT(*) as total_rounds,
      SUM(aciertos) as total_hits,
      ROUND(AVG(aciertos), 2) as avg_hits,
      MAX(aciertos) as best_round,
      MIN(aciertos) as worst_round
    FROM porras
    GROUP BY usuario
    ORDER BY total_hits DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get all Porras rounds
 * @returns {Array} All rounds with results
 */
export function getAllPorrasRounds() {
  const query = `
    SELECT 
      jornada,
      usuario,
      aciertos
    FROM porras
    ORDER BY jornada DESC, aciertos DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get squad statistics for all users
 * @returns {Array} Squad stats per user
 */
/**
 * Get squad statistics for all users
 * @returns {Array} Squad stats per user
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
 * Get the next upcoming round
 * @returns {Object} Next round details
 */
export function getNextRound() {
  // Find the first match in the future
  const query = `
    SELECT 
      round_id,
      round_name,
      MIN(date) as start_date
    FROM matches
    WHERE date > datetime('now')
    GROUP BY round_id
    ORDER BY date ASC
    LIMIT 1
  `;
  return db.prepare(query).get();
}

// Export db instance for custom queries if needed
export { db };

/**
 * Get top performing players
 * @param {number} limit - Number of players
 * @returns {Array} List of top players
 */
export function getTopPlayers(limit = 10) {
  const query = `
    SELECT 
      id, name, team, position, 
      puntos as points, 
      ROUND(CAST(puntos AS FLOAT) / NULLIF(partidos_jugados, 0), 1) as average
    FROM players 
    ORDER BY puntos DESC 
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get recent market activity
 * @param {number} limit - Number of transfers
 * @returns {Array} Recent transfers
 */
export function getRecentTransfers(limit = 5) {
  const query = `
    SELECT 
      f.*,
      p.name as player_name,
      p.position
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    ORDER BY f.timestamp DESC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get league standings (Latest)
 * @returns {Array} Current standings with user details
 */
export function getStandings() {
  const query = `
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
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
  return db.prepare(query).all();
}

/**
 * Get market trends (Volume & Avg Price per day)
 * @returns {Array} Daily market stats
 */
export function getMarketTrends() {
  const query = `
    SELECT 
      substr(fecha, 1, 10) as date,
      COUNT(*) as count,
      ROUND(AVG(precio), 0) as avg_value
    FROM fichajes
    GROUP BY date
    ORDER BY date ASC
    LIMIT 30
  `;
  return db.prepare(query).all();
}
