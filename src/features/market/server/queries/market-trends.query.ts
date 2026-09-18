import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface MarketTrendRecord {
  date: string;
  volume: number | string | null;
  avg_price: number | string | null;
  ops_count: number | string;
  transfers: { player_name: string | null; price: number | null }[] | null;
}

/** Internal numeric days are supplied by trusted services or the validated HTTP edge. */
export async function readMarketTrendRows(days: number): Promise<MarketTrendRecord[]> {
  const seasonId = await resolveReadSeasonId();
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
    WHERE f.season_id = $1 AND f.timestamp >= extract(epoch from (now() - interval '${days} days'))
    GROUP BY date
    ORDER BY date ASC
  `;
  const result = await pgClient.query(query, [seasonId]);
  return result.rows as MarketTrendRecord[];
}
