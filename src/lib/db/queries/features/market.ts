import { db } from '../../client';

// ==========================================
// INTERFACES
// ==========================================

export interface CurrentMarketListing {
  player_id: number;
  name: string;
  img: string;
  position: string;
  team_id: number | null;
  team: string | null;
  team_img: string | null;
  price: number;
  price_trend: number;
  avg_recent_points: number;
  recent_scores: string;
  value_score: number;
  total_points: number;
  season_avg: number;
  seller_id: string | null;
  seller_name: string | null;
  seller_icon: string | null;
  seller_color: number | null;
  next_opponent_id: number | null;
  next_opponent_name: string | null;
  next_opponent_img: string | null;
  next_match_date: string | null;
}

export interface Transfer {
  id: number;
  fecha: string;
  player_id: number;
  precio: number;
  vendedor: string;
  comprador: string;
}

export interface RecentTransfer extends Transfer {
  player_name: string;
  position: string;
  vendedor_id: number | null;
  vendedor_color_index: number | null;
  comprador_id: number | null;
  comprador_color_index: number | null;
}

export interface MarketTrend {
  date: string;
  count: number;
  avg_value: number;
}

export interface MarketOpportunity {
  player_id: number;
  name: string;
  position: string;
  team_id: number | null;
  team: string | null;
  price: number;
  price_trend: number;
  avg_recent_points: number;
  recent_scores: string;
  value_score: number;
}

export interface PriceChange {
  player_id: number;
  name: string;
  position: string;
  team: string | null;
  price: number;
  price_increment: number;
  owner_id: number | null;
}

export interface MarketKPIs {
  total_transfers: number;
  avg_value: number;
  max_value: number;
  min_value: number;
  active_buyers: number;
  active_sellers: number;
}

export interface MarketOverviewKPIs {
  totalVolume: number;
  totalOps: number;
  avgPrice: number;
  avgBids: number;
}

export interface TopTransferredPlayer {
  player_id: number;
  name: string;
  img: string;
  transfer_count: number;
  avg_price: number;
}

export interface EnrichedTransfer extends Transfer {
  player_name: string;
  player_img: string;
  buyer_id: number;
  buyer_name: string;
  buyer_icon: string;
  buyer_color: number;
}

export interface BigSpender {
  name: string;
  total_spent: number;
  purchases_count: number;
}

export interface RecordBid {
  transfer_id: number;
  bid_count: number;
  player_id: number;
  precio: number;
  comprador: string;
  player_name: string;
  player_img: string;
}

export interface MarketAnalysisDay {
  date: string;
  volume: number;
  avg_price: number;
  ops_count: number;
  transfers: { player_name: string; price: number }[];
}

export interface PositionAnalysis {
  mostSigned: { position: string; count: number } | null;
  distribution: {
    position: string;
    count: number;
    avg_price: number;
    total_volume: number;
  }[];
}

export interface PaginatedTransfers {
  transfers: (Transfer & {
    player_name: string;
    player_position: string;
    player_img: string;
    bids_count: number;
  })[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ManagerMarketStats {
  user_name: string;
  purchases_count: number;
  purchases_total: number;
  sales_count: number;
  sales_total: number;
  balance: number;
}

export interface BestSeller {
  name: string;
  net_profit: number;
  total_sales: number;
  sales_count: number;
}

export interface BestRevaluation {
  player_id: number;
  player_name: string;
  player_img: string;
  current_price: number;
  purchase_price: number;
  revaluation: number;
  user_id: number;
  user_name: string;
  user_color_index: number;
}

export interface BestValuePlayer {
  user_id: number;
  user_name: string;
  user_color_index: number;
  player_id: number;
  player_name: string;
  player_img: string;
  transfer_id: number;
  purchase_price: number;
  total_points: number;
  points_per_million: number;
}

export interface BestValueDetail {
  round_name: string;
  date: string;
  points: number;
  opponent: string;
  team_id: number;
}

export interface TheThief {
  name: string;
  stolen_count: number;
}

export interface BiggestSteal {
  transfer_id: number;
  winning_price: number;
  winner: string;
  player_id: number;
  player_name: string;
  player_img: string;
  second_highest_bid: number;
  second_bidder_name: string;
  price_diff: number;
}

export interface TheVictim {
  name: string;
  failed_bids_count: number;
}

export interface SingleFlip {
  user_id: number;
  user_name: string;
  user_color_index: number;
  player_id: number;
  player_name: string;
  player_img: string;
  purchase_price: number;
  sale_price: number;
  profit: number;
}

export interface PercentageGain {
  user_id: number;
  user_name: string;
  user_color_index: number;
  player_id: number;
  player_name: string;
  player_img: string;
  current_price: number;
  purchase_price: number;
  percentage_gain: number;
}

export interface MostOwnersPlayer {
  player_id: number;
  player_name: string;
  player_img: string;
  distinct_owners_count: number;
}

export interface MissedOpportunity {
  user_id: number;
  user_name: string;
  user_color_index: number;
  player_id: number;
  player_name: string;
  player_img: string;
  current_price: number;
  sale_price: number;
  missed_profit: number;
}

export interface TopTrader {
  user_id: number;
  user_name: string;
  user_color_index: number;
  trade_count: number;
  total_profit: number;
}

export interface PlayerProfitability {
  player_id: number;
  player_name: string;
  player_img: string;
  trade_count: number;
  total_profit?: number;
  total_loss?: number;
}

export interface QuickFlip extends SingleFlip {
  hours_held: number;
}

export interface LongHold extends SingleFlip {
  days_held: number;
}

export interface Devaluation {
  user_id: number;
  user_name: string;
  user_color_index: number;
  player_id: number;
  player_name: string;
  player_img: string;
  current_price: number;
  purchase_price: number;
  devaluation: number;
}

// ==========================================
// LEGACY QUERIES (Preserved for compatibility)
// ==========================================

/**
 * Get all transfers with pagination
 * @param {number} limit - Number of results
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Transfer[]>} List of transfers
 */
export async function getAllTransfers(limit = 100, offset = 0): Promise<Transfer[]> {
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
 * @returns {Promise<RecentTransfer[]>} Recent transfers
 */
export async function getRecentTransfers(limit = 5): Promise<RecentTransfer[]> {
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
 * @returns {Promise<MarketTrend[]>} Daily market stats
 */
export async function getMarketTrends(): Promise<MarketTrend[]> {
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
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    count: parseInt(row.count) || 0,
    avg_value: parseFloat(row.avg_value) || 0,
  }));
}

/**
 * Get market opportunities (undervalued players with good form)
 * @param {number} limit - Number of opportunities to return
 * @returns {Promise<MarketOpportunity[]>} List of recommended buys
 */
export async function getMarketOpportunities(limit = 3): Promise<MarketOpportunity[]> {
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

  return (await db.query(query, [limit])).rows.map((row: any) => ({
    ...row,
    avg_recent_points: parseFloat(row.avg_recent_points) || 0,
    value_score: parseFloat(row.value_score) || 0,
  }));
}

/**
 * Get significant price changes in the last period
 * @param {number} hoursAgo - Hours to look back
 * @param {number} minChange - Minimum price change threshold
 * @returns {Promise<PriceChange[]>} Players with significant price changes
 */
export async function getSignificantPriceChanges(
  hoursAgo = 24,
  minChange = 500000
): Promise<PriceChange[]> {
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
 * @returns {Promise<MarketKPIs>} Market statistics
 */
export async function getMarketKPIs(): Promise<MarketKPIs> {
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
export async function getMarketOverviewKPIs(): Promise<MarketOverviewKPIs> {
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
export async function getTopTransferredPlayer(): Promise<TopTransferredPlayer[]> {
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

  return result.rows.map((row: any) => ({
    ...row,
    transfer_count: parseInt(row.transfer_count),
    avg_price: parseInt(row.avg_price),
  }));
}

/**
 * Get Record Transfer (Highest Price)
 * "Récord Histórico"
 */
export async function getRecordTransfer(): Promise<EnrichedTransfer[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    precio: parseInt(row.precio),
  }));
}

/**
 * Get Big Spender (User who spent most)
 * "El Jeque"
 */
export async function getBigSpender(): Promise<BigSpender[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    total_spent: parseInt(row.total_spent),
    purchases_count: parseInt(row.purchases_count),
  }));
}

/**
 * Get Record Bid (Transfer with most bids)
 * "Récord Pujas"
 */
export async function getRecordBid(): Promise<RecordBid[]> {
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
    return result.rows.map((row: any) => ({
      ...row,
      bid_count: parseInt(row.bid_count),
    }));
  } catch (error: any) {
    console.warn('Could not fetch record bid:', error.message);
    return [];
  }
}

/**
 * Get Market Trends Analysis (Last 30 days)
 * Series: Volume, Avg Price
 * NEW VERSION used in Market Page Charts
 */
export async function getMarketTrendsAnalysis(days = 30): Promise<MarketAnalysisDay[]> {
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
  return result.rows.map((r: any) => ({
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
export async function getPositionAnalysis(): Promise<PositionAnalysis> {
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
    distribution: rows.map((r: any) => ({
      position: r.position,
      count: parseInt(r.count),
      avg_price: parseInt(r.avg_price),
      total_volume: parseInt(r.total_volume),
    })),
  };
}

interface LiveMarketTransfersParams {
  page?: number;
  limit?: number;
  buyer?: string;
  seller?: string;
}

/**
 * Get Live Market Transfers with Pagination and Filters
 */
export async function getLiveMarketTransfers({
  page = 1,
  limit = 20,
  buyer = 'all',
  seller = 'all',
}: LiveMarketTransfersParams): Promise<PaginatedTransfers> {
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE f.precio > 0';
  const params: any[] = [];
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
    transfers: rowsResult.rows.map((r: any) => ({
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
export async function getManagerMarketStats(): Promise<ManagerMarketStats[]> {
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
  return result.rows.map((r: any) => ({
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
export async function getBestSeller(): Promise<BestSeller[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getBestRevaluation(): Promise<BestRevaluation[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    current_price: parseInt(row.current_price),
    purchase_price: parseInt(row.purchase_price),
    revaluation: parseInt(row.revaluation),
  }));
}

/**
 * Get Best Value Deal (Points Earned DURING OWNERSHIP / Million Euro of Purchase Price)
 * "El Chollo"
 * - Calculates points earned by the user *while they owned the player*.
 * - Logic: Sum(Points in ownership window) / Purchase Price (in Millions).
 */
export async function getBestValuePlayer(): Promise<BestValuePlayer[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getBestValueDetails(transferId: number): Promise<BestValueDetail[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getWorstValuePlayer(): Promise<BestValuePlayer[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getTheThief(): Promise<TheThief[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    stolen_count: parseInt(row.stolen_count),
  }));
}

/**
 * Get "Mayor Robo" (Biggest Steal)
 * The transfer with the smallest difference between winning price and second highest bid.
 */
export async function getBiggestSteal(): Promise<BiggestSteal[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getTheVictim(): Promise<TheVictim[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    failed_bids_count: parseInt(row.failed_bids_count),
  }));
}

/**
 * Get Best Single Flip (Buy Low, Sell High)
 * "El Pelotazo"
 * - Highest realized profit from a single transaction
 */
export async function getBestSingleFlip(): Promise<SingleFlip[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getWorstSingleFlip(): Promise<SingleFlip[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getBestPercentageGain(): Promise<PercentageGain[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getMostOwnersPlayer(): Promise<MostOwnersPlayer[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getMissedOpportunity(): Promise<MissedOpportunity[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getTopTrader(): Promise<TopTrader[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getProfitablePlayer(): Promise<PlayerProfitability[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getLossyPlayer(): Promise<PlayerProfitability[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getQuickestFlip(): Promise<QuickFlip[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getLongestProfitableHold(): Promise<LongHold[]> {
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
  return result.rows.map((row: any) => ({
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
export async function getWorstRevaluation(): Promise<Devaluation[]> {
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
  return result.rows.map((row: any) => ({
    ...row,
    current_price: parseInt(row.current_price),
    purchase_price: parseInt(row.purchase_price),
    devaluation: parseInt(row.devaluation),
  }));
}

/**
 * Get the players that are currently on the market for today.
 * Enriches them with recent form, full season stats, seller info, and next opponent info.
 * @returns {Promise<CurrentMarketListing[]>}
 */
export async function getCurrentMarketListings(): Promise<CurrentMarketListing[]> {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 5
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    PlayerForm AS (
      SELECT 
        ml.player_id,
        SUM(prs.fantasy_points) * 1.0 / NULLIF((SELECT total_rounds FROM RoundCount), 0) as avg_recent_points,
        STRING_AGG(COALESCE(CAST(prs.fantasy_points AS TEXT), 'X'), ',' ORDER BY rr.round_id DESC) as recent_scores
      FROM (SELECT DISTINCT player_id FROM market_listings WHERE listed_at = (SELECT MAX(listed_at) FROM market_listings)) ml
      CROSS JOIN RecentRounds rr
      LEFT JOIN player_round_stats prs ON prs.player_id = ml.player_id AND prs.round_id = rr.round_id
      GROUP BY ml.player_id
    ),
    PlayerTotals AS (
      SELECT 
        player_id,
        (SELECT COUNT(*) FROM player_round_stats WHERE player_id = prs.player_id) as games_played,
        ROUND(AVG(fantasy_points), 1) as season_avg,
        SUM(fantasy_points) as total_points
      FROM player_round_stats prs
      GROUP BY player_id
    ),
    TeamNextMatch AS (
      SELECT 
        team_id,
        opponent_id,
        opponent_name,
        opponent_img,
        date
      FROM (
        SELECT 
          t.id as team_id,
          CASE WHEN m.home_id = t.id THEN m.away_id ELSE m.home_id END as opponent_id,
          CASE WHEN m.home_id = t.id THEN ta.name ELSE th.name END as opponent_name,
          CASE WHEN m.home_id = t.id THEN ta.img ELSE th.img END as opponent_img,
          m.date,
          ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.date ASC) as rn
        FROM teams t
        JOIN matches m ON m.home_id = t.id OR m.away_id = t.id
        LEFT JOIN teams th ON m.home_id = th.id
        LEFT JOIN teams ta ON m.away_id = ta.id
        WHERE m.date > NOW()
      ) sub
      WHERE rn = 1
    )
    SELECT 
      ml.player_id,
      p.name,
      p.img,
      p.position,
      t.id as team_id,
      t.name as team,
      t.img as team_img,
      ml.price,
      COALESCE(p.price_increment, 0) as price_trend,
      COALESCE(pf.avg_recent_points, 0) as avg_recent_points,
      pf.recent_scores,
      ROUND(COALESCE(pf.avg_recent_points, 0) * 1000000.0 / NULLIF(ml.price, 0), 2) as value_score,
      COALESCE(pt.total_points, 0) as total_points,
      COALESCE(pt.season_avg, 0) as season_avg,
      ml.seller_id,
      u.name as seller_name,
      u.icon as seller_icon,
      u.color_index as seller_color,
      -- Next opponent logic
      tnm.opponent_id as next_opponent_id,
      tnm.opponent_name as next_opponent_name,
      tnm.opponent_img as next_opponent_img,
      tnm.date as next_match_date
    FROM market_listings ml
    JOIN players p ON ml.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON ml.seller_id::text = u.id::text
    LEFT JOIN PlayerForm pf ON p.id = pf.player_id
    LEFT JOIN PlayerTotals pt ON p.id = pt.player_id
    LEFT JOIN TeamNextMatch tnm ON tnm.team_id = p.team_id
    WHERE ml.listed_at = (SELECT MAX(listed_at) FROM market_listings)
    ORDER BY value_score DESC NULLS LAST, price_trend DESC, ml.price DESC
  `;

  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    price: parseInt(row.price),
    price_trend: parseInt(row.price_trend),
    avg_recent_points: parseFloat(row.avg_recent_points) || 0,
    value_score: parseFloat(row.value_score) || 0,
    total_points: parseFloat(row.total_points) || 0,
    season_avg: parseFloat(row.season_avg) || 0,
  }));
}
