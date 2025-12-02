
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
      comprador,
      pujas,
      puntos
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
export function getSquadStats() {
  const query = `
    SELECT 
      s.user_id,
      COUNT(DISTINCT s.player_id) as squad_size,
      SUM(COALESCE(mv.price, 0)) as total_value,
      ur.total_points
    FROM user_squads s
    LEFT JOIN market_values mv ON s.player_id = mv.player_id
    LEFT JOIN (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    ) ur ON s.user_id = ur.user_id
    WHERE s.date_scraped = (SELECT MAX(date_scraped) FROM user_squads)
    GROUP BY s.user_id
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
      p.points,
      p.average,
      p.img_url,
      p.status
    FROM players p
    WHERE p.owner_id = ?
    ORDER BY p.points DESC
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
