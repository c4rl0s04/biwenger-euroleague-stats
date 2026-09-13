import 'server-only';
import { pgClient } from '@/lib/db/connection';
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
      p.position,
      COUNT(*) as count,
      AVG(f.precio) as avg_price,
      SUM(f.precio) as total_volume
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.season_id = $1
      AND f.vendedor = 'Mercado'
      AND f.comprador != 'Mercado'
      AND f.precio > 0
    GROUP BY p.position
    ORDER BY count DESC
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readMarketDuels(): Promise<MarketDuelFacts> {
  const seasonId = await resolveReadSeasonId();
  const [usersResult, duelsResult] = await Promise.all([
    pgClient.query(
      `
      SELECT u.id, COALESCE(us.name, u.name) as name, COALESCE(us.icon, u.icon) as icon, COALESCE(us.color_index, u.color_index, 0) as color_index
      FROM user_seasons us
      JOIN users u ON u.id = us.user_id
      WHERE us.season_id = $1 AND COALESCE(us.status, 'active') <> 'inactive'
      ORDER BY COALESCE(us.name, u.name) ASC
    `,
      [seasonId]
    ),
    pgClient.query(
      `
      SELECT
        winner.id as winner_id,
        COALESCE(winner_season.name, winner.name) as winner_name,
        COALESCE(winner_season.icon, winner.icon) as winner_icon,
        COALESCE(winner_season.color_index, winner.color_index, 0) as winner_color_index,
        runner.id as runner_id,
        COALESCE(runner_season.name, runner.name) as runner_name,
        COALESCE(runner_season.icon, runner.icon) as runner_icon,
        COALESCE(runner_season.color_index, runner.color_index, 0) as runner_color_index,
        (f.precio - second_bid.amount) as margin
      FROM fichajes f
      JOIN user_seasons winner_season ON winner_season.name = f.comprador AND winner_season.season_id = f.season_id
      JOIN users winner ON winner.id = winner_season.user_id
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
      JOIN users runner ON runner.id = runner_season.user_id
      WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    `,
      [seasonId]
    ),
  ]);

  return { users: usersResult.rows, duels: duelsResult.rows };
}
