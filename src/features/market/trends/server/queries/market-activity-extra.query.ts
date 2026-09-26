import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { RecentTransferRecord, PriceChangeRecord } from './market-activity-extra.records';

export async function readRecentTransfers(limit = 5): Promise<RecentTransferRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.*,
      p.name as player_name,
      ps.position,
      seller.user_id as vendedor_id,
      seller.color_index as vendedor_color_index,
      buyer.user_id as comprador_id,
      buyer.color_index as comprador_color_index
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = f.player_id AND ps.season_id = f.season_id
    LEFT JOIN user_seasons seller ON f.vendedor = seller.name AND seller.season_id = f.season_id
    LEFT JOIN user_seasons buyer ON f.comprador = buyer.name AND buyer.season_id = f.season_id
    WHERE f.season_id = $2
    ORDER BY f.timestamp DESC
    LIMIT $1
  `;
  return (await pgClient.query(query, [limit, seasonId])).rows;
}

export async function readSignificantPriceChanges(
  minChange = 500000
): Promise<PriceChangeRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name,
      ps.position,
      t.name as team,
      ps.price as price,
      ps.price_increment as price_increment,
      ps.owner_id
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $2
      AND ABS(COALESCE(ps.price_increment, 0)) >= $1
    ORDER BY ABS(COALESCE(ps.price_increment, 0)) DESC
    LIMIT 5
  `;
  return (await pgClient.query(query, [minChange, seasonId])).rows;
}
