import 'server-only';
import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
export async function readTopTransferredPlayer(): Promise<TopTransferredPlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.player_id,
      p.name,
      p.img,
      t.code as player_team,
      COUNT(*) as transfer_count,
      AVG(f.precio) as avg_price,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = f.season_id
    WHERE f.season_id = $1 AND f.precio > 0
    GROUP BY f.player_id, p.name, p.img, t.code, ps.owner_id, us.name, u.name, us.color_index, u.color_index
    ORDER BY transfer_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readRecordTransfer(): Promise<EnrichedTransferRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.*,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      t.name as team_name,
      t.img as team_logo,
      ub.id as buyer_id,
      ub.name as buyer_name,
      ub.icon as buyer_icon,
      ub.color_index as buyer_color,
      us.id as seller_id,
      us.name as seller_name,
      us.icon as seller_icon,
      us.color_index as seller_color
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN user_seasons usb ON f.comprador = usb.name AND usb.season_id = f.season_id
    LEFT JOIN users ub ON COALESCE(usb.user_id, '') = ub.id
    LEFT JOIN user_seasons uss ON f.vendedor = uss.name AND uss.season_id = f.season_id
    LEFT JOIN users us ON COALESCE(uss.user_id, '') = us.id
    WHERE f.season_id = $1
    ORDER BY f.precio DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBigSpender(): Promise<BigSpenderRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.comprador as name,
      COALESCE(us.user_id, u.id) as user_id,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,
      SUM(f.precio) as total_spent,
      COUNT(*) as purchases_count
    FROM fichajes f
    LEFT JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id OR f.comprador = u.name
    WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    GROUP BY f.comprador, us.user_id, u.id, us.color_index, u.color_index
    ORDER BY total_spent DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBestSeller(): Promise<BestSellerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      s.vendedor as name,
      u.id as user_id,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,
      SUM(s.precio - p.precio) as net_profit,
      SUM(s.precio) as total_sales,
      COUNT(*) as sales_count
    FROM fichajes s
    LEFT JOIN user_seasons us ON us.name = s.vendedor AND us.season_id = s.season_id
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    CROSS JOIN LATERAL (
        SELECT precio
        FROM fichajes p
        WHERE p.season_id = s.season_id
          AND p.player_id = s.player_id
          AND p.comprador = s.vendedor
          AND p.timestamp < s.timestamp
        ORDER BY p.timestamp DESC
        LIMIT 1
    ) p
    WHERE s.season_id = $1 AND s.vendedor != 'Mercado' -- Only check user sales
    GROUP BY s.vendedor, u.id, us.color_index, u.color_index
    ORDER BY net_profit DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readMostOwnersPlayer(): Promise<MostOwnersPlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      t.name as team_name,
      t.img as team_logo,
      COUNT(DISTINCT f.comprador) as distinct_owners_count,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = f.season_id
    WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img, t.code, t.name, t.img, ps.owner_id, us.name, u.name, us.color_index, u.color_index
    HAVING COUNT(DISTINCT f.comprador) > 1
    ORDER BY distinct_owners_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readManagerMarketStats(): Promise<ManagerMarketStatsRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH managers AS (
      SELECT COALESCE(us.name, u.name) as user_name, u.id, u.icon, COALESCE(us.color_index, u.color_index, 0) as color_index
      FROM user_seasons us
      JOIN users u ON u.id = us.user_id
      WHERE us.season_id = $1 AND COALESCE(us.name, u.name) IS NOT NULL
    ),
    purchases AS (
      SELECT f.comprador as user_name, COUNT(*) as count, SUM(f.precio) as total
      FROM fichajes f
      JOIN managers m ON m.user_name = f.comprador
      WHERE f.season_id = $1 AND f.comprador != 'Mercado'
      GROUP BY f.comprador
    ),
    sales AS (
      SELECT f.vendedor as user_name, COUNT(*) as count, SUM(f.precio) as total
      FROM fichajes f
      JOIN managers m ON m.user_name = f.vendedor
      WHERE f.season_id = $1 AND f.vendedor != 'Mercado'
      GROUP BY f.vendedor
    )
    SELECT
      m.id as user_id,
      m.icon as user_icon,
      m.color_index as color_index,
      COALESCE(p.user_name, s.user_name) as user_name,
      COALESCE(p.count, 0) as purchases_count,
      COALESCE(p.total, 0) as purchases_total,
      COALESCE(s.count, 0) as sales_count,
      COALESCE(s.total, 0) as sales_total
    FROM purchases p
    FULL OUTER JOIN sales s ON p.user_name = s.user_name
    JOIN managers m ON m.user_name = COALESCE(p.user_name, s.user_name)
    ORDER BY (COALESCE(s.total, 0) - COALESCE(p.total, 0)) DESC
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
import type {
  TopTransferredPlayerRecord,
  EnrichedTransferRecord,
  BigSpenderRecord,
  BestSellerRecord,
  MostOwnersPlayerRecord,
  ManagerMarketStatsRecord,
} from './market-summary.records';
