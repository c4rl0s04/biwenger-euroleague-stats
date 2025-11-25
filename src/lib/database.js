/**
 * Database access layer using better-sqlite3
 *
 * This module provides functions to query the SQLite database
 * that was created by the Python scraper.
 */

import Database from 'better-sqlite3';

// Connect to the SHARED database from the Flask project
// Both Flask and Next.js will use the same database file
const dbPath = '/Users/carlosandreshuete/Documents/Python/SimpleBiwenger/data/biwenger.db';
const db = new Database(dbPath, { readonly: true });

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
 * Get user squad details
 * @param {string} userId - User ID
 * @returns {Array} Player details
 */
export function getUserSquad(userId) {
  const query = `
    SELECT 
      p.name,
      p.position,
      p.team,
      p.puntos,
      p.partidos_jugados,
      p.media,
      COALESCE(mv.price, 0) as value
    FROM user_squads us
    JOIN players p ON us.player_id = p.id
    LEFT JOIN market_values mv ON p.id = mv.player_id
    WHERE us.user_id = ?
      AND us.date_scraped = (SELECT MAX(date_scraped) FROM user_squads)
    ORDER BY p.position, p.name
  `;

  return db.prepare(query).all(userId);
}

/**
 * Get market trends over time
 * @returns {Array} Transfer volumes by date
 */
export function getMarketTrends() {
  const query = `
    SELECT 
      DATE(fecha) as date,
      COUNT(*) as count,
      ROUND(AVG(precio), 2) as avg_value
    FROM fichajes
    GROUP BY DATE(fecha)
    ORDER BY date DESC
    LIMIT 30
  `;
  
  return db.prepare(query).all().reverse();
}

/**
 * Get league standings
 * @returns {Array} Current standings
 */
export function getStandings() {
  const query = `
    SELECT 
      user_id,
      position,
      points,
      team_value
    FROM standings
    WHERE date_recorded = (SELECT MAX(date_recorded) FROM standings)
    ORDER BY position ASC
  `;

  return db.prepare(query).all();
}

// Export db instance for custom queries if needed
export { db };
