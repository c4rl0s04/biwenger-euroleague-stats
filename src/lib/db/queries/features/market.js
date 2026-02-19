import { db } from '../../client';

// ==========================================
// LEGACY QUERIES (Preserved for compatibility)
// ==========================================

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
 * LEGACY VERSION - Returns count, avg_value
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

/**
 * Get Market KPIs
 * LEGACY VERSION - Returns distinct buyer/seller counts
 * @returns {Promise<Object>} Market statistics
 */
export async function getMarketKPIs() {
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

  const kpis = (await db.query(query)).rows[0];
  return {
    ...kpis,
    total_transfers: parseInt(kpis?.total_transfers) || 0,
    avg_value: parseFloat(kpis?.avg_value) || 0,
    active_buyers: parseInt(kpis?.active_buyers) || 0,
    active_sellers: parseInt(kpis?.active_sellers) || 0,
    max_value: parseInt(kpis?.max_value) || 0,
    min_value: parseInt(kpis?.min_value) || 0,
  };
}

// ==========================================
// NEW QUERIES (For Market Page V2)
// ==========================================

/**
 * Get Market Overview KPIs
 * - Total Volume (sum of prices)
 * - Total Operations (count)
 * - Average Price
 */
export async function getMarketOverviewKPIs() {
  const query = `
    WITH BidStats AS (
      SELECT COUNT(*) as losing_bids FROM transfer_bids
    ),
    TransferStats AS (
      SELECT COUNT(*) as total_transfers FROM fichajes WHERE precio > 0
    )
    SELECT 
      (SELECT SUM(precio) FROM fichajes WHERE precio > 0) as total_volume,
      (SELECT total_transfers FROM TransferStats) as total_ops,
      (SELECT AVG(precio) FROM fichajes WHERE precio > 0) as avg_price,
      (SELECT 1.0 + (losing_bids::float / NULLIF(total_transfers, 0)) FROM BidStats, TransferStats) as avg_bids
  `;
  const result = await db.query(query);
  const row = result.rows[0];

  return {
    totalVolume: parseInt(row.total_volume) || 0,
    totalOps: parseInt(row.total_ops) || 0,
    avgPrice: parseInt(row.avg_price) || 0,
    avgBids: parseFloat(row.avg_bids) || 0,
  };
}

/**
 * Get Top Transferred Player (Most frequent transfers)
 * "El más fichado"
 */
export async function getTopTransferredPlayer() {
  const query = `
    SELECT 
      f.player_id,
      p.name,
      p.img,
      COUNT(*) as transfer_count,
      AVG(f.precio) as avg_price
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    WHERE f.precio > 0
    GROUP BY f.player_id, p.name, p.img
    ORDER BY transfer_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];

  return result.rows.map((row) => ({
    ...row,
    transfer_count: parseInt(row.transfer_count),
    avg_price: parseInt(row.avg_price),
  }));
}

/**
 * Get Record Transfer (Highest Price)
 * "Récord Histórico"
 */
export async function getRecordTransfer() {
  const query = `
    SELECT 
      f.*,
      p.name as player_name,
      p.img as player_img,
      u.id as buyer_id,
      u.name as buyer_name,
      u.icon as buyer_icon,
      u.color_index as buyer_color
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    LEFT JOIN users u ON f.comprador = u.name
    ORDER BY f.precio DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    precio: parseInt(row.precio),
  }));
}

/**
 * Get Big Spender (User who spent most)
 * "El Jeque"
 */
export async function getBigSpender() {
  const query = `
    SELECT 
      comprador as name,
      SUM(precio) as total_spent,
      COUNT(*) as purchases_count
    FROM fichajes
    WHERE comprador != 'Mercado'
    GROUP BY comprador
    ORDER BY total_spent DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    total_spent: parseInt(row.total_spent),
    purchases_count: parseInt(row.purchases_count),
  }));
}

/**
 * Get Record Bid (Transfer with most bids)
 * "Récord Pujas"
 */
export async function getRecordBid() {
  const query = `
    SELECT 
      t.transfer_id,
      COUNT(*) as bid_count,
      f.player_id,
      f.precio,
      f.comprador,
      p.name as player_name,
      p.img as player_img
    FROM transfer_bids t
    JOIN fichajes f ON t.transfer_id = f.id
    LEFT JOIN players p ON f.player_id = p.id
    GROUP BY t.transfer_id, f.player_id, f.precio, f.comprador, p.name, p.img
    ORDER BY bid_count DESC
    LIMIT 10
  `;
  try {
    const result = await db.query(query);
    if (!result.rows.length) return [];
    return result.rows.map((row) => ({
      ...row,
      bid_count: parseInt(row.bid_count),
    }));
  } catch (error) {
    console.warn('Could not fetch record bid:', error.message);
    return [];
  }
}

/**
 * Get Market Trends Analysis (Last 30 days)
 * Series: Volume, Avg Price
 * NEW VERSION used in Market Page Charts
 */
export async function getMarketTrendsAnalysis(days = 30) {
  const query = `
    SELECT 
      TO_CHAR(to_timestamp(f.timestamp), 'YYYY-MM-DD') as date,
      SUM(f.precio) as volume,
      AVG(f.precio) as avg_price,
      COUNT(*) as ops_count,
      json_agg(json_build_object(
        'player_name', p.name,
        'price', f.precio
      ) ORDER BY f.precio DESC) as transfers
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.timestamp >= extract(epoch from (now() - interval '${days} days'))
    GROUP BY date
    ORDER BY date ASC
  `;
  const result = await db.query(query);
  return result.rows.map((r) => ({
    date: r.date,
    volume: parseInt(r.volume),
    avg_price: parseInt(r.avg_price),
    ops_count: parseInt(r.ops_count),
    transfers: r.transfers || [],
  }));
}

/**
 * Get Position Analysis
 * - Most signed position
 * - Price Stats by position
 */
export async function getPositionAnalysis() {
  const query = `
    SELECT 
      p.position,
      COUNT(*) as count,
      AVG(f.precio) as avg_price,
      SUM(f.precio) as total_volume
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.vendedor = 'Mercado'
      AND f.comprador != 'Mercado'
      AND f.precio > 0
    GROUP BY p.position
    ORDER BY count DESC
  `;
  const result = await db.query(query);
  const rows = result.rows;

  if (!rows.length) return { mostSigned: null, distribution: [] };

  return {
    mostSigned: {
      position: rows[0].position,
      count: parseInt(rows[0].count),
    },
    distribution: rows.map((r) => ({
      position: r.position,
      count: parseInt(r.count),
      avg_price: parseInt(r.avg_price),
      total_volume: parseInt(r.total_volume),
    })),
  };
}

/**
 * Get Live Market Transfers with Pagination and Filters
 */
export async function getLiveMarketTransfers({
  page = 1,
  limit = 20,
  buyer = 'all',
  seller = 'all',
}) {
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE f.precio > 0';
  const params = [];
  let paramIndex = 1;

  if (buyer && buyer !== 'all' && buyer !== 'Todos') {
    whereClause += ` AND f.comprador = $${paramIndex}`;
    params.push(buyer);
    paramIndex++;
  }

  if (seller && seller !== 'all' && seller !== 'Todos') {
    whereClause += ` AND f.vendedor = $${paramIndex}`;
    params.push(seller);
    paramIndex++;
  }

  // Row Query
  const query = `
    SELECT 
      f.id,
      f.fecha,
      f.precio,
      f.vendedor,
      f.comprador,
      p.name as player_name,
      p.position as player_position,
      p.img as player_img,
      (SELECT COUNT(*) FROM transfer_bids tb WHERE tb.transfer_id = f.id) as bids_count
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    ${whereClause}
    ORDER BY f.timestamp DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  // Count Query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM fichajes f
    ${whereClause}
  `;

  // Add limit and offset
  params.push(limit, offset);

  const [rowsResult, countResult] = await Promise.all([
    db.query(query, params),
    db.query(countQuery, params.slice(0, paramIndex - 1)),
  ]);

  return {
    transfers: rowsResult.rows.map((r) => ({
      ...r,
      precio: parseInt(r.precio),
      bids_count: parseInt(r.bids_count),
    })),
    total: parseInt(countResult.rows[0].total),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  };
}

/**
 * Get Manager Finances (Purchases/Sales Balance)
 */
export async function getManagerMarketStats() {
  const query = `
    WITH purchases AS (
      SELECT comprador as user_name, COUNT(*) as count, SUM(precio) as total 
      FROM fichajes 
      WHERE comprador != 'Mercado' 
      GROUP BY comprador
    ),
    sales AS (
      SELECT vendedor as user_name, COUNT(*) as count, SUM(precio) as total 
      FROM fichajes 
      WHERE vendedor != 'Mercado' 
      GROUP BY vendedor
    )
    SELECT 
      COALESCE(p.user_name, s.user_name) as user_name,
      COALESCE(p.count, 0) as purchases_count,
      COALESCE(p.total, 0) as purchases_total,
      COALESCE(s.count, 0) as sales_count,
      COALESCE(s.total, 0) as sales_total
    FROM purchases p
    FULL OUTER JOIN sales s ON p.user_name = s.user_name
    ORDER BY (COALESCE(s.total, 0) - COALESCE(p.total, 0)) DESC
  `;

  const result = await db.query(query);
  return result.rows.map((r) => ({
    user_name: r.user_name,
    purchases_count: parseInt(r.purchases_count),
    purchases_total: parseInt(r.purchases_total),
    sales_count: parseInt(r.sales_count),
    sales_total: parseInt(r.sales_total),
    balance: parseInt(r.sales_total) - parseInt(r.purchases_total),
  }));
}

/**
 * Get Best Seller (User with highest REALIZED net profit)
 * "El Negociador"
 * - Calculates (Sale Price - Purchase Price) for players bought AND sold.
 * - Excludes unsold players (inventory) and initial team sales (no purchase price).
 */
export async function getBestSeller() {
  const query = `
    SELECT 
      s.vendedor as name,
      SUM(s.precio - p.precio) as net_profit,
      SUM(s.precio) as total_sales,
      COUNT(*) as sales_count
    FROM fichajes s
    CROSS JOIN LATERAL (
        SELECT precio 
        FROM fichajes p
        WHERE p.player_id = s.player_id 
          AND p.comprador = s.vendedor
          AND p.timestamp < s.timestamp
        ORDER BY p.timestamp DESC
        LIMIT 1
    ) p
    WHERE s.vendedor != 'Mercado' -- Only check user sales
    GROUP BY s.vendedor
    ORDER BY net_profit DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    total_sales: parseInt(row.total_sales),
    net_profit: parseInt(row.net_profit),
    sales_count: parseInt(row.sales_count),
  }));
}

/**
 * Get Best Revaluation (Current player value - Purchase Price)
 * "El Visionario"
 * - Finds active ownership where price increased most since purchase
 */
export async function getBestRevaluation() {
  const query = `
    SELECT 
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      p.price as current_price,
      f.precio as purchase_price,
      (p.price - f.precio) as revaluation,
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index
    FROM players p
    JOIN fichajes f ON p.id = f.player_id AND p.owner_id IS NOT NULL
    JOIN users u ON p.owner_id = u.id
    -- Find the *last* purchase for this player by the CURRENT owner
    WHERE f.id = (
      SELECT id FROM fichajes 
      WHERE player_id = p.id AND comprador = u.name 
      ORDER BY timestamp DESC LIMIT 1
    )
    ORDER BY revaluation DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    current_price: parseInt(row.current_price),
    purchase_price: parseInt(row.purchase_price),
    revaluation: parseInt(row.revaluation),
  }));
}

/**
 * Get Best Value Deal (Points / Million Euro of Purchase Price)
 * "El Chollo"
 * - Logic: Total Points of player / Purchase Price (in Millions)
 * - Minimum price 100k, Max lookback 6 months
 */
/**
 * Get Best Value Deal (Points Earned DURING OWNERSHIP / Million Euro of Purchase Price)
 * "El Chollo"
 * - Calculates points earned by the user *while they owned the player*.
 * - Logic: Sum(Points in ownership window) / Purchase Price (in Millions).
 */
export async function getBestValuePlayer() {
  const query = `
    WITH RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      GROUP BY round_id
    )
    SELECT 
      curr_owner.id as user_id,
      curr_owner.name as user_name,
      curr_owner.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      f.id as transfer_id,
      f.precio as purchase_price,
      
      -- Calculate total points earned in valid rounds
      (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          AND to_timestamp(f.timestamp) < rs.start_date
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      ) as total_points,

      -- Calculate Ratio
      (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          AND to_timestamp(f.timestamp) < rs.start_date
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      )::float * 1000000 / NULLIF(f.precio, 0) as points_per_million

    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    JOIN users curr_owner ON f.comprador = curr_owner.name
    
    LEFT JOIN LATERAL (
        SELECT timestamp 
        FROM fichajes s
        WHERE s.player_id = f.player_id 
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE f.precio > 100000 
      AND f.comprador != 'Mercado'

    ORDER BY points_per_million DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    total_points: parseInt(row.total_points),
    purchase_price: parseInt(row.purchase_price),
    points_per_million: parseFloat(row.points_per_million),
    transfer_id: row.transfer_id,
  }));
}

/**
 * Get breakdown of points for a specific transfer ownership window
 */
export async function getBestValueDetails(transferId) {
  const query = `
    WITH purchase AS (
      SELECT 
        f.id as transfer_id,
        f.player_id,
        f.comprador,
        f.timestamp as start_time,
        f.precio
      FROM fichajes f
      WHERE f.id = $1
    ),
    sale AS (
      SELECT 
        s.timestamp as end_time
      FROM fichajes s, purchase p
      WHERE s.player_id = p.player_id 
        AND s.vendedor = p.comprador
        AND s.timestamp > p.start_time
      ORDER BY s.timestamp ASC
      LIMIT 1
    ),
    RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      GROUP BY round_id
    )
    SELECT 
      m.round_name,
      m.date,
      COALESCE(prs.fantasy_points, 0) as points,
      (
         CASE 
           WHEN m.home_id = pl.team_id THEN t_away.name
           ELSE t_home.name
         END
      ) as opponent,
      pl.team_id
    FROM player_round_stats prs
    JOIN purchase p ON prs.player_id = p.player_id
    JOIN players pl ON p.player_id = pl.id
    JOIN matches m ON m.round_id = prs.round_id
      AND (m.home_id = pl.team_id OR m.away_id = pl.team_id)
    JOIN RoundStarts rs ON rs.round_id = prs.round_id
    LEFT JOIN teams t_home ON m.home_id = t_home.id
    LEFT JOIN teams t_away ON m.away_id = t_away.id
    LEFT JOIN sale s ON true
    WHERE 
      -- Ownership must start BEFORE round lock
      to_timestamp(p.start_time) < rs.start_date
      -- Must still own player when round starts
      AND (
         s.end_time IS NULL OR to_timestamp(s.end_time) > rs.start_date
      )
    ORDER BY m.date ASC
  `;
  const result = await db.query(query, [transferId]);
  return result.rows.map((row) => ({
    ...row,
    points: parseInt(row.points),
  }));
}

/**
 * Get Worst Value Deal (High Price / Low Points)
 * "El Flop"
 * - Same logic as Best Value but ordering by ASC
 * - Only considers players costing > 2M to identify true "flops"
 */
export async function getWorstValuePlayer() {
  const query = `
    WITH RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      GROUP BY round_id
    )
    SELECT 
      curr_owner.id as user_id,
      curr_owner.name as user_name,
      curr_owner.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      f.id as transfer_id,
      f.precio as purchase_price,
      
      -- Calculate total points earned in valid rounds (Owned BEFORE round start)
      (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          -- Ownership must start BEFORE round lock
          AND to_timestamp(f.timestamp) < rs.start_date
          -- Must still own player when round starts
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      ) as total_points,

      -- Calculate Ratio
      (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          AND to_timestamp(f.timestamp) < rs.start_date
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      )::float * 1000000 / NULLIF(f.precio, 0) as points_per_million

    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    JOIN users curr_owner ON f.comprador = curr_owner.name
    
    -- Find the next sale
    LEFT JOIN LATERAL (
        SELECT timestamp 
        FROM fichajes s
        WHERE s.player_id = f.player_id 
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE f.precio > 2000000 -- Only expensive players
      AND f.comprador != 'Mercado'
      
      -- Ensure player played in at least one VALID round where user had ownership
      AND EXISTS (
          SELECT 1
          FROM player_round_stats prs
          JOIN RoundStarts rs ON rs.round_id = prs.round_id
          WHERE prs.player_id = p.id
            AND to_timestamp(f.timestamp) < rs.start_date
            AND (
               sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
            )
      )

    ORDER BY points_per_million ASC, purchase_price DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    total_points: parseInt(row.total_points),
    purchase_price: parseInt(row.purchase_price),
    points_per_million: parseFloat(row.points_per_million),
    transfer_id: row.transfer_id,
  }));
}

/**
 * Get "El Ladrón" (The Thief)
 * User who has signed the most players that had bids from OTHER users.
 * i.e., "Stolen" under their noses.
 */
export async function getTheThief() {
  const query = `
    SELECT 
      f.comprador as name,
      COUNT(DISTINCT f.id) as stolen_count
    FROM fichajes f
    JOIN transfer_bids tb ON f.id = tb.transfer_id
    WHERE f.comprador != 'Mercado'
      AND tb.bidder_name != f.comprador -- Bid was from someone else
    GROUP BY f.comprador
    ORDER BY stolen_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    stolen_count: parseInt(row.stolen_count),
  }));
}

/**
 * Get "Mayor Robo" (Biggest Steal)
 * The transfer with the smallest difference between winning price and second highest bid.
 */
/**
 * Get "Mayor Robo" (Biggest Steal)
 * The transfer with the smallest difference between winning price and second highest bid.
 */
export async function getBiggestSteal() {
  const query = `
    WITH ValidTransfers AS (
      SELECT id, precio, comprador, player_id 
      FROM fichajes 
      WHERE comprador != 'Mercado'
    )
    SELECT 
      f.id as transfer_id,
      f.precio as winning_price,
      f.comprador as winner,
      f.player_id,
      p.name as player_name,
      p.img as player_img,
      second_bid.amount as second_highest_bid,
      second_bid.bidder_name as second_bidder_name,
      (f.precio - second_bid.amount) as price_diff
    FROM ValidTransfers f
    JOIN players p ON f.player_id = p.id
    CROSS JOIN LATERAL (
        SELECT amount, bidder_name
        FROM transfer_bids tb
        WHERE tb.transfer_id = f.id
          AND tb.amount < f.precio -- losing bid
        ORDER BY tb.amount DESC
        LIMIT 1
    ) second_bid
    ORDER BY price_diff ASC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    winning_price: parseInt(row.winning_price),
    second_highest_bid: parseInt(row.second_highest_bid),
    price_diff: parseInt(row.price_diff),
  }));
}

/**
 * Get "La Víctima" (The Victim)
 * User with the most failed bids (bids that did not result in a purchase).
 */
export async function getTheVictim() {
  const query = `
    SELECT 
        tb.bidder_name as name,
        COUNT(*) as failed_bids_count
    FROM transfer_bids tb
    JOIN fichajes f ON tb.transfer_id = f.id
    WHERE tb.bidder_name != f.comprador -- The bidder was NOT the winner
      AND tb.bidder_name != 'Mercado' -- Exclude system
    GROUP BY tb.bidder_name
    ORDER BY failed_bids_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    failed_bids_count: parseInt(row.failed_bids_count),
  }));
}

/**
 * Get Best Single Flip (Buy Low, Sell High)
 * "El Pelotazo"
 * - Highest realized profit from a single transaction
 */
export async function getBestSingleFlip() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    JOIN players p ON purchase.player_id = p.id
    
    -- Join with the sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
    ORDER BY profit DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    purchase_price: parseInt(row.purchase_price),
    sale_price: parseInt(row.sale_price),
    profit: parseInt(row.profit),
  }));
}

/**
 * Get Worst Single Flip (Buy High, Sell Low)
 * "El Fiasco"
 * - Biggest loss from a single transaction
 */
export async function getWorstSingleFlip() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    JOIN players p ON purchase.player_id = p.id
    
    -- Join with the sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
    ORDER BY profit ASC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    purchase_price: parseInt(row.purchase_price),
    sale_price: parseInt(row.sale_price),
    profit: parseInt(row.profit),
  }));
}

/**
 * Get Best Unrealized Percentage Gain
 * "El Diamante en Bruto"
 * - (Current Value - Purchase Price) / Purchase Price
 * - Only for currently owned players
 */
export async function getBestPercentageGain() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      p.price as current_price,
      
      f.precio as purchase_price,
      ((p.price - f.precio)::float / NULLIF(f.precio, 0)) * 100 as percentage_gain
      
    FROM fichajes f
    JOIN users u ON f.comprador = u.name
    JOIN players p ON f.player_id = p.id
    
    -- Ensure player is still owned by this purchase (no subsequent sale)
    LEFT JOIN LATERAL (
        SELECT timestamp 
        FROM fichajes s
        WHERE s.player_id = f.player_id 
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        LIMIT 1
    ) sale ON true
    
    WHERE f.comprador != 'Mercado'
      AND sale.timestamp IS NULL -- Still owned
      AND f.precio > 150000 -- Avoid trivial gains on min price players

    ORDER BY percentage_gain DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    current_price: parseInt(row.current_price),
    purchase_price: parseInt(row.purchase_price),
    percentage_gain: parseFloat(row.percentage_gain),
  }));
}

/**
 * Get Player with Most Unique Owners
 * "El Inquieto"
 */
export async function getMostOwnersPlayer() {
  const query = `
    SELECT 
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      COUNT(DISTINCT f.comprador) as distinct_owners_count
      
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img
    ORDER BY distinct_owners_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    distinct_owners_count: parseInt(row.distinct_owners_count),
  }));
}

/**
 * Get Missed Opportunity (Sold too early)
 * "El Impaciente"
 * - Users who sold players that later went up significantly in value
 * - Shows (Current Price - Sale Price) as missed profit
 */
export async function getMissedOpportunity() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      p.price as current_price,
      
      sale.precio as sale_price,
      (p.price - sale.precio) as missed_profit
      
    FROM fichajes sale
    JOIN users u ON sale.vendedor = u.name
    JOIN players p ON sale.player_id = p.id
    
    WHERE sale.vendedor != 'Mercado'
      AND p.price > sale.precio
    ORDER BY missed_profit DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    current_price: parseInt(row.current_price),
    sale_price: parseInt(row.sale_price),
    missed_profit: parseInt(row.missed_profit),
  }));
}

/**
 * Get Top Trader (Most Buy-Sell Cycles)
 * "El Especulador"
 * - User with the most completed buy→sell transactions
 */
export async function getTopTrader() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_profit
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    
    -- Join with the subsequent sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
    GROUP BY u.id, u.name, u.color_index
    ORDER BY trade_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    trade_count: parseInt(row.trade_count),
    total_profit: parseInt(row.total_profit),
  }));
}

/**
 * Get Most Profitable Player (across all owners)
 * "La Gallina de los Huevos de Oro"
 * - Player that has generated the most combined profit for all owners
 */
export async function getProfitablePlayer() {
  const query = `
    SELECT 
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_profit
      
    FROM fichajes purchase
    JOIN players p ON purchase.player_id = p.id
    
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img
    HAVING SUM(sale.precio - purchase.precio) > 0
    ORDER BY total_profit DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    trade_count: parseInt(row.trade_count),
    total_profit: parseInt(row.total_profit),
  }));
}

/**
 * Get Most Lossy Player (across all owners)
 * "El Ruinoso"
 * - Player that has caused the most combined losses for all owners
 */
export async function getLossyPlayer() {
  const query = `
    SELECT 
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_loss
      
    FROM fichajes purchase
    JOIN players p ON purchase.player_id = p.id
    
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img
    HAVING SUM(sale.precio - purchase.precio) < 0
    ORDER BY total_loss ASC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    trade_count: parseInt(row.trade_count),
    total_loss: parseInt(row.total_loss),
  }));
}

/**
 * Get Quickest Profitable Flip
 * "El Quickflip"
 * - Fastest buy→sell with profit (shortest time between transactions)
 */
export async function getQuickestFlip() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit,
      (sale.timestamp - purchase.timestamp) / 3600.0 as hours_held
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    JOIN players p ON purchase.player_id = p.id
    
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) > 0
    ORDER BY (sale.timestamp - purchase.timestamp) ASC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    purchase_price: parseInt(row.purchase_price),
    sale_price: parseInt(row.sale_price),
    profit: parseInt(row.profit),
    hours_held: parseFloat(row.hours_held),
  }));
}

/**
 * Get Longest Profitable Hold
 * "El Hold"
 * - Longest ownership period that still resulted in profit
 */
export async function getLongestProfitableHold() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      
      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit,
      (sale.timestamp - purchase.timestamp) / 86400.0 as days_held
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    JOIN players p ON purchase.player_id = p.id
    
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.player_id = purchase.player_id 
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true
    
    WHERE purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) > 0
    ORDER BY (sale.timestamp - purchase.timestamp) DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    purchase_price: parseInt(row.purchase_price),
    sale_price: parseInt(row.sale_price),
    profit: parseInt(row.profit),
    days_held: parseFloat(row.days_held),
  }));
}

/**
 * Get Worst Unrealized Revaluation
 * "El Depreciado"
 * - Currently owned players with biggest unrealized losses
 */
export async function getWorstRevaluation() {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      p.price as current_price,
      
      purchase.precio as purchase_price,
      (p.price - purchase.precio) as devaluation
      
    FROM fichajes purchase
    JOIN users u ON purchase.comprador = u.name
    JOIN players p ON purchase.player_id = p.id
    
    -- Ensure player is still owned (no sale after purchase)
    WHERE purchase.comprador != 'Mercado'
      AND NOT EXISTS (
          SELECT 1 FROM fichajes s
          WHERE s.player_id = purchase.player_id 
            AND s.vendedor = purchase.comprador
            AND s.timestamp > purchase.timestamp
      )
      AND p.price < purchase.precio
    ORDER BY devaluation ASC
    LIMIT 10
  `;
  const result = await db.query(query);
  if (!result.rows.length) return [];
  return result.rows.map((row) => ({
    ...row,
    current_price: parseInt(row.current_price),
    purchase_price: parseInt(row.purchase_price),
    devaluation: parseInt(row.devaluation),
  }));
}
