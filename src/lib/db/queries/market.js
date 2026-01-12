import { db } from '../client.js';

/**
 * Get all transfers with pagination
 * @param {number} limit - Number of results
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} List of transfers
 */
export async function getAllTransfers(limit = 100, offset = 0) {
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
    LIMIT $1 OFFSET $2
  `;

  return (await db.query(query, [limit, offset])).rows;
}

/**
 * Get recent market activity
 * @param {number} limit - Number of transfers
 * @returns {Promise<Array>} Recent transfers
 */
export async function getRecentTransfers(limit = 5) {
  const query = `
    SELECT 
      f.*,
      p.name as player_name,
      p.position,
      seller.id as vendedor_id,
      seller.color_index as vendedor_color_index,
      buyer.id as comprador_id,
      buyer.color_index as comprador_color_index
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN users seller ON f.vendedor = seller.name
    LEFT JOIN users buyer ON f.comprador = buyer.name
    ORDER BY f.timestamp DESC
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows;
}

/**
 * Get market trends (Volume & Avg Price per day)
 * @returns {Promise<Array>} Daily market stats
 */
export async function getMarketTrends() {
  const query = `
    SELECT 
      TO_CHAR(fecha::timestamp, 'YYYY-MM-DD') as date,
      COUNT(*) as count,
      ROUND(AVG(precio), 0) as avg_value
    FROM fichajes
    GROUP BY date
    ORDER BY date ASC
    LIMIT 30
  `;
  return (await db.query(query)).rows.map((row) => ({
    ...row,
    count: parseInt(row.count) || 0,
    avg_value: parseFloat(row.avg_value) || 0,
  }));
}

/**
 * Get market opportunities (undervalued players with good form)
 * @param {number} limit - Number of opportunities to return
 * @returns {Promise<Array>} List of recommended buys
 */
export async function getMarketOpportunities(limit = 3) {
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
        STRING_AGG(CAST(fantasy_points AS TEXT), ',') as recent_scores
      FROM (
        SELECT player_id, fantasy_points
        FROM player_round_stats
        WHERE round_id IN (SELECT round_id FROM RecentRounds)
        ORDER BY round_id DESC
      ) sub
      GROUP BY player_id
      HAVING COUNT(*) >= 2
    )
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      t.id as team_id,
      t.name as team,
      p.price,
      COALESCE(p.price_increment, 0) as price_trend,
      COALESCE(pf.avg_recent_points, 0) as avg_recent_points,
      pf.recent_scores,
      ROUND(COALESCE(pf.avg_recent_points, 0) * 1000000.0 / NULLIF(p.price, 0), 2) as value_score
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN PlayerForm pf ON p.id = pf.player_id
    WHERE p.owner_id IS NULL
      AND p.price > 0
      AND pf.avg_recent_points >= 12
    ORDER BY value_score DESC, price_trend DESC
    LIMIT $1
  `;

  return (await db.query(query, [limit])).rows.map((row) => ({
    ...row,
    avg_recent_points: parseFloat(row.avg_recent_points) || 0,
    value_score: parseFloat(row.value_score) || 0,
  }));
}

/**
 * Get significant price changes in the last period
 * @param {number} hoursAgo - Hours to look back
 * @param {number} minChange - Minimum price change threshold
 * @returns {Promise<Array>} Players with significant price changes
 */
export async function getSignificantPriceChanges(hoursAgo = 24, minChange = 500000) {
  const query = `
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      t.name as team,
      p.price,
      p.price_increment,
      p.owner_id
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE ABS(COALESCE(p.price_increment, 0)) >= $1
    ORDER BY ABS(price_increment) DESC
    LIMIT 5
  `;

  return (await db.query(query, [minChange])).rows;
}
