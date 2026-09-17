import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  MarketActivityTransferRecord,
  MarketActivityTrendRecord,
  MarketActivityKPIRecord,
} from './market-activity.records';

export async function readMarketActivityTransfers(
  limit: number,
  offset: number
): Promise<MarketActivityTransferRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      id,
      fecha,
      player_id,
      precio,
      vendedor,
      comprador
    FROM fichajes
    WHERE season_id = $3
    ORDER BY timestamp DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pgClient.query(query, [limit, offset, seasonId]);
  return result.rows as MarketActivityTransferRecord[];
}

export async function readMarketActivityTrends(): Promise<MarketActivityTrendRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      TO_CHAR(fecha::timestamp, 'YYYY-MM-DD') as date,
      COUNT(*) as count,
      ROUND(AVG(precio), 0) as avg_value
    FROM fichajes
    WHERE season_id = $1
    GROUP BY date
    ORDER BY date ASC
    LIMIT 30
  `;
  const result = await pgClient.query(query, [seasonId]);
  return result.rows as MarketActivityTrendRecord[];
}

export async function readMarketActivityKPIs(): Promise<MarketActivityKPIRecord | undefined> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      COUNT(*) as total_transfers,
      ROUND(AVG(precio), 2) as avg_value,
      MAX(precio) as max_value,
      MIN(precio) as min_value,
      COUNT(DISTINCT comprador) as active_buyers,
      COUNT(DISTINCT vendedor) as active_sellers
    FROM fichajes
    WHERE season_id = $1
  `;

  const result = await pgClient.query(query, [seasonId]);
  return result.rows[0] as MarketActivityKPIRecord | undefined;
}
