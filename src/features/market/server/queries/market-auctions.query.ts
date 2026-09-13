import 'server-only';
import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
export async function readRecordBid(seasonId: string): Promise<RecordBidRecord[]> {
  const query = `
    SELECT
      t.transfer_id,
      COUNT(*) as bid_count,
      f.player_id,
      f.precio,
      f.comprador,
      u.id as buyer_id,
      u.color_index as buyer_color_index,
      p.name as player_name,
      p.img as player_img,
      tm.code as player_team,
      tm.name as team_name,
      tm.img as team_logo
    FROM transfer_bids t
    JOIN fichajes f ON t.transfer_id = f.id AND t.season_id = f.season_id
    LEFT JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    LEFT JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams tm ON COALESCE(ps.team_id, p.team_id) = tm.id
    WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    GROUP BY t.transfer_id, f.player_id, f.precio, f.comprador, u.id, us.color_index, u.color_index, p.name, p.img, tm.code, tm.name, tm.img
    HAVING COUNT(*) >= 1 -- At least one loser exists, so at least 2 total bidders
    ORDER BY bid_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readTheThief(): Promise<TheThiefRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.comprador as name,
      u.id as user_id,
      u.color_index as user_color_index,
      COUNT(DISTINCT f.id) as stolen_count
    FROM fichajes f
    JOIN transfer_bids tb ON f.id = tb.transfer_id AND tb.season_id = f.season_id
    LEFT JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    WHERE f.season_id = $1
      AND f.comprador != 'Mercado'
      AND tb.bidder_name != f.comprador -- Bid was from someone else
    GROUP BY f.comprador, u.id, us.color_index, u.color_index
    ORDER BY stolen_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBiggestSteal(): Promise<BiggestStealRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH ValidTransfers AS (
      SELECT id, precio, comprador, player_id
      FROM fichajes
      WHERE season_id = $1 AND comprador != 'Mercado'
    )
    SELECT
      f.id as transfer_id,
      f.precio as winning_price,
      f.comprador as winner,
      u.id as winner_id,
      u.color_index as winner_color_index,
      f.player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      second_bid.amount as second_highest_bid,
      second_bid.bidder_name as second_bidder_name,
      (f.precio - second_bid.amount) as price_diff
    FROM ValidTransfers f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN user_seasons us ON us.name = f.comprador AND us.season_id = $1
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    CROSS JOIN LATERAL (
        SELECT amount, bidder_name, bidder_id, bidder_color_index
        FROM (
            -- We look for the highest LOSING bid.
            -- If multiple people bid the same as the winner, we count that as a steal with 0 diff.
            -- One of the bids for this transfer_id in transfer_bids MUST be the winning f.precio.
            -- So we look for bids where id != (the row that matched f.precio)
            -- or more simply: bids that are ONE of the multiple bids.

            SELECT tb.amount, tb.bidder_name, u2.id as bidder_id, u2.color_index as bidder_color_index
            FROM transfer_bids tb
            LEFT JOIN user_seasons us2 ON us2.name = tb.bidder_name AND us2.season_id = tb.season_id
            LEFT JOIN users u2 ON COALESCE(us2.user_id, '') = u2.id
            WHERE tb.season_id = $1
              AND tb.transfer_id = f.id
              AND tb.bidder_name != f.comprador -- The winner isn't a losing bid
            ORDER BY tb.amount DESC
            LIMIT 1
        ) sub
    ) second_bid
    ORDER BY price_diff ASC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readTheVictim(): Promise<TheVictimRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
        tb.bidder_name as name,
        u.id as user_id,
        u.color_index as user_color_index,
        COUNT(*) as failed_bids_count
    FROM transfer_bids tb
    JOIN fichajes f ON tb.transfer_id = f.id AND tb.season_id = f.season_id
    LEFT JOIN user_seasons us ON us.name = tb.bidder_name AND us.season_id = tb.season_id
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    WHERE tb.season_id = $1
      AND tb.bidder_name != f.comprador -- The bidder was NOT the winner
      AND tb.bidder_name != 'Mercado' -- Exclude system
    GROUP BY tb.bidder_name, u.id, us.color_index, u.color_index
    ORDER BY failed_bids_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readOverpayerManager(): Promise<OverpayerManagerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH CompetitiveWins AS (
      SELECT
        f.id as transfer_id,
        f.comprador as name,
        f.precio as winning_price,
        second_bid.amount as second_highest_bid,
        (f.precio - second_bid.amount) as overpay
      FROM fichajes f
      JOIN LATERAL (
        SELECT tb.amount
        FROM transfer_bids tb
        WHERE tb.season_id = f.season_id
          AND tb.transfer_id = f.id
          AND tb.bidder_name != f.comprador
          AND tb.amount < f.precio
        ORDER BY tb.amount DESC
        LIMIT 1
      ) second_bid ON true
      WHERE f.season_id = $1 AND f.comprador != 'Mercado'
    )
    SELECT
      cw.name,
      u.id as user_id,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,
      COUNT(*) as contested_wins,
      SUM(cw.overpay) as total_overpay,
      AVG(cw.overpay) as avg_overpay
    FROM CompetitiveWins cw
    LEFT JOIN user_seasons us ON us.name = cw.name AND us.season_id = $1
    LEFT JOIN users u ON COALESCE(us.user_id, '') = u.id
    WHERE cw.overpay > 0
    GROUP BY cw.name, u.id, us.color_index, u.color_index
    ORDER BY total_overpay DESC, avg_overpay DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readInflatedPlayer(): Promise<InflatedPlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH TransferWithMarketValue AS (
      SELECT
        f.id as transfer_id,
        p.id as player_id,
        p.name as player_name,
        p.img as player_img,
        t.code as player_team,
        f.precio as purchase_price,
        mv.price as market_price,
        (f.precio - mv.price) as inflation
      FROM fichajes f
      JOIN players p ON p.id = f.player_id
      LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
      LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
      JOIN LATERAL (
        SELECT mv.price
        FROM market_values mv
        WHERE mv.season_id = f.season_id
          AND mv.player_id = f.player_id
          AND mv.date <= to_timestamp(f.timestamp)::date
        ORDER BY mv.date DESC
        LIMIT 1
      ) mv ON true
      WHERE f.season_id = $1
        AND f.comprador != 'Mercado'
        AND f.precio > mv.price
    )
    SELECT
      t.player_id,
      t.player_name,
      t.player_img,
      t.player_team,
      t.inflation,
      t.purchase_price,
      t.market_price,
      u.id as buyer_id,
      u.name as buyer_name,
      u.color_index as buyer_color,
      t.transfer_id
    FROM TransferWithMarketValue t
    JOIN fichajes f ON t.transfer_id = f.id AND f.season_id = $1
    JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    JOIN users u ON u.id = us.user_id
    ORDER BY t.inflation DESC
    LIMIT 100;

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
import type {
  RecordBidRecord,
  TheThiefRecord,
  BiggestStealRecord,
  TheVictimRecord,
  OverpayerManagerRecord,
  InflatedPlayerRecord,
} from './market-auctions.records';
export const resolveMarketAuctionSeason = resolveReadSeasonId;
