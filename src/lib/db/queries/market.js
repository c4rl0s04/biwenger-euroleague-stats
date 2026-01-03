import { db } from '../client.js';

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
 * Get recent market activity
 * @param {number} limit - Number of transfers
 * @returns {Array} Recent transfers
 */
export function getRecentTransfers(limit = 5) {
  const query = `
    SELECT 
      f.*,
      p.name as player_name,
      p.position,
      seller.id as vendedor_id,
      buyer.id as comprador_id
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN users seller ON f.vendedor = seller.name
    LEFT JOIN users buyer ON f.comprador = buyer.name
    ORDER BY f.timestamp DESC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
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

/**
 * Get market opportunities (undervalued players with good form)
 * @param {number} limit - Number of opportunities to return
 * @returns {Array} List of recommended buys
 */
export function getMarketOpportunities(limit = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 3
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    PlayerForm AS (
      SELECT 
        player_id,
        SUM(fantasy_points) * 1.0 / (SELECT total_rounds FROM RoundCount) as avg_recent_points,
        GROUP_CONCAT(fantasy_points) as recent_scores
      FROM (
        SELECT player_id, fantasy_points
        FROM player_round_stats
        WHERE round_id IN (SELECT round_id FROM RecentRounds)
        ORDER BY round_id DESC
      )
      GROUP BY player_id
      HAVING COUNT(*) >= 2
    )
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      p.team,
      p.price,
      COALESCE(p.price_increment, 0) as price_trend,
      COALESCE(pf.avg_recent_points, 0) as avg_recent_points,
      pf.recent_scores,
      ROUND(COALESCE(pf.avg_recent_points, 0) * 1000000.0 / NULLIF(p.price, 0), 2) as value_score
    FROM players p
    LEFT JOIN PlayerForm pf ON p.id = pf.player_id
    WHERE p.owner_id IS NULL
      AND p.price > 0
      AND pf.avg_recent_points >= 12
    ORDER BY value_score DESC, price_trend DESC
    LIMIT ?
  `;

  return db.prepare(query).all(limit);
}

/**
 * Get significant price changes in the last period
 * @param {number} hoursAgo - Hours to look back
 * @param {number} minChange - Minimum price change threshold
 * @returns {Array} Players with significant price changes
 */
export function getSignificantPriceChanges(hoursAgo = 24, minChange = 500000) {
  const query = `
    SELECT 
      id as player_id,
      name,
      position,
      team,
      price,
      price_increment,
      owner_id
    FROM players
    WHERE ABS(COALESCE(price_increment, 0)) >= ?
    ORDER BY ABS(price_increment) DESC
    LIMIT 5
  `;

  return db.prepare(query).all(minChange);
}
