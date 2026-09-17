import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  MarketOverviewRecord,
  MarketPositionRecord,
  MarketDuelFacts,
} from './market-overview.records';

export async function readMarketOverview(): Promise<MarketOverviewRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH BidStats AS (
      SELECT COUNT(*) as losing_bids FROM transfer_bids WHERE season_id = $1
    ),
    TransferStats AS (
      SELECT COUNT(*) as total_transfers FROM fichajes WHERE season_id = $1 AND precio > 0
    )
    SELECT
      (SELECT SUM(precio) FROM fichajes WHERE season_id = $1 AND precio > 0) as total_volume,
      (SELECT total_transfers FROM TransferStats) as total_ops,
      (SELECT AVG(precio) FROM fichajes WHERE season_id = $1 AND precio > 0) as avg_price,
      (SELECT 1.0 + (losing_bids::float / NULLIF(total_transfers, 0)) FROM BidStats, TransferStats) as avg_bids
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}

export async function readMarketPositions(): Promise<MarketPositionRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      ps.position,
      COUNT(*) as count,
      AVG(f.precio) as avg_price,
      SUM(f.precio) as total_volume
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = f.player_id AND ps.season_id = f.season_id
    WHERE f.season_id = $1
      AND f.vendedor = 'Mercado'
      AND f.comprador != 'Mercado'
      AND f.precio > 0
    GROUP BY ps.position
    ORDER BY count DESC
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}

export async function readMarketDuels(): Promise<MarketDuelFacts> {
  const seasonId = await resolveReadSeasonId();
  const [usersResult, duelsResult] = await Promise.all([
    pgClient.query(
      `
      SELECT us.user_id as id, us.name, us.icon, us.color_index
      FROM user_seasons us
      WHERE us.season_id = $1 AND us.status <> 'inactive'
      ORDER BY us.name ASC
    `,
      [seasonId]
    ),
    pgClient.query(
      `
      SELECT
        winner_season.user_id as winner_id,
        winner_season.name as winner_name,
        winner_season.icon as winner_icon,
        winner_season.color_index as winner_color_index,
        runner_season.user_id as runner_id,
        runner_season.name as runner_name,
        runner_season.icon as runner_icon,
        runner_season.color_index as runner_color_index,
        (f.precio - second_bid.amount) as margin
      FROM fichajes f
      JOIN user_seasons winner_season ON winner_season.name = f.comprador AND winner_season.season_id = f.season_id
      JOIN LATERAL (
        SELECT tb.bidder_name, tb.amount
        FROM transfer_bids tb
        WHERE tb.season_id = f.season_id
          AND tb.transfer_id = f.id
          AND tb.bidder_name != f.comprador
          AND tb.amount < f.precio
        ORDER BY tb.amount DESC
        LIMIT 1
      ) second_bid ON true
      JOIN user_seasons runner_season ON runner_season.name = second_bid.bidder_name AND runner_season.season_id = f.season_id
      WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    `,
      [seasonId]
    ),
  ]);

  return { users: usersResult.rows, duels: duelsResult.rows };
}
