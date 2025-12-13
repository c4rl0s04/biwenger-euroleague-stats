import { db } from '../client.js';

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

/**
 * Get the winner of the last completed round
 * @returns {Object} User who won the last round
 */
export function getLastRoundWinner() {
  const query = `
    WITH LastRound AS (
      SELECT MAX(round_id) as round_id
      FROM user_rounds
      WHERE participated = 1
    )
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      ur.points,
      ur.round_name
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id = (SELECT round_id FROM LastRound)
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  return db.prepare(query).get();
}

/**
 * Get user's recent rounds performance
 * @param {string} userId - User ID
 * @param {number} limit - Number of rounds
 * @returns {Array} Recent rounds with position
 */
export function getUserRecentRounds(userId, limit = 10) {
  const query = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = 1
    )
    SELECT 
      round_id,
      round_name,
      points,
      position
    FROM RoundPositions
    WHERE user_id = ?
    ORDER BY round_id DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(userId, limit);
}

/**
 * Get best performers from the last completed round
 * @param {number} limit - Number of MVPs
 * @returns {Array} Top MVPs from last round
 */
export function getLastRoundMVPs(limit = 5) {
  const query = `
    WITH LastRound AS (
      SELECT MAX(round_id) as last_round_id
      FROM player_round_stats
    )
    SELECT 
      prs.player_id,
      p.name,
      p.team,
      p.position,
      prs.fantasy_points as points,
      u.name as owner_name
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 * @returns {Array} List of players with their stats for the last round
 */
export function getLastRoundStats() {
  const query = `
    WITH LastRound AS (
      SELECT MAX(round_id) as last_round_id
      FROM player_round_stats
    )
    SELECT 
      prs.player_id,
      p.name,
      p.team,
      p.position,
      p.price,
      prs.fantasy_points as points,
      u.name as owner_name,
      (SELECT round_name FROM matches WHERE round_id = prs.round_id LIMIT 1) as round_name
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
  `;
  return db.prepare(query).all();
}
