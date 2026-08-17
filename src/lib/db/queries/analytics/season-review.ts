import 'server-only';
import { pgClient } from '../../index';
import { REVIEW_SEASON_ID } from '../../../season-review/types';

export interface SeasonReviewRawData {
  users: Array<{ id: string; name: string; color_index: number }>;
  userRounds: Array<{
    user_id: string;
    round_id: number;
    round_name: string;
    points: number;
    participated: boolean;
  }>;
  lineups: Array<{
    user_id: string;
    round_id: number;
    player_id: number;
  }>;
  playerStats: Array<{
    round_id: number;
    player_id: number;
    fantasy_points: number;
    position: string | null;
  }>;
  finances: Array<{
    user_id: string;
    round_id: number;
    date: string;
    type: string;
    amount: number;
    description: string;
  }>;
  initialSquads: Array<{ user_id: string; player_id: number; price: number }>;
  transfers: Array<{
    timestamp: number;
    fecha: string;
    player_id: number;
    precio: number;
    vendedor: string;
    comprador: string;
  }>;
  marketValues: Array<{ date: string; player_id: number; price: number }>;
  marketListings: Array<{
    listed_at: string;
    automatic: number;
    total: number;
  }>;
  counts: {
    rawFinanceRows: number;
    uniqueFinanceEvents: number;
    transfers: number;
    initialSquadRows: number;
    marketValueRows: number;
    marketSnapshotDays: number;
    totalPlayers: number;
  };
}

export async function getSeasonReviewRawData(): Promise<SeasonReviewRawData> {
  const seasonId = REVIEW_SEASON_ID;
  const [
    users,
    userRounds,
    lineups,
    playerStats,
    finances,
    initialSquads,
    transfers,
    marketValues,
    marketListings,
    counts,
  ] = await Promise.all([
    pgClient.query(
      `SELECT us.user_id AS id, COALESCE(us.name, u.name) AS name,
              COALESCE(us.color_index, u.color_index, 0) AS color_index
       FROM user_seasons us
       JOIN users u ON u.id = us.user_id
       WHERE us.season_id = $1 AND COALESCE(us.status, 'active') = 'active'
       ORDER BY COALESCE(us.name, u.name)`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT user_id, round_id, COALESCE(round_name, 'Jornada') AS round_name,
              COALESCE(points, 0) AS points, COALESCE(participated, true) AS participated
       FROM user_rounds
       WHERE season_id = $1
       ORDER BY round_id, user_id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT user_id, round_id, player_id
       FROM lineups
       WHERE season_id = $1
       ORDER BY round_id, user_id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT prs.round_id, prs.player_id, COALESCE(prs.fantasy_points, 0) AS fantasy_points,
              p.position
       FROM player_round_stats prs
       LEFT JOIN players p ON p.id = prs.player_id
       WHERE prs.season_id = $1
       ORDER BY prs.round_id, prs.fantasy_points DESC NULLS LAST, prs.player_id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT DISTINCT user_id, round_id, date, type, amount, description
       FROM finances
       WHERE season_id = $1 AND type = 'round_bonus'
       ORDER BY round_id, user_id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT user_id, player_id, COALESCE(price, 0) AS price
       FROM initial_squads
       WHERE season_id = $1`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT timestamp, fecha, player_id, COALESCE(precio, 0) AS precio, vendedor, comprador
       FROM fichajes
       WHERE season_id = $1
       ORDER BY timestamp, id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT date::text, player_id, COALESCE(price, 0) AS price
       FROM market_values
       WHERE season_id = $1 AND date <= DATE '2026-05-25'
       ORDER BY date, player_id`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT listed_at::text,
              COUNT(*) FILTER (WHERE seller_id IS NULL)::int AS automatic,
              COUNT(*)::int AS total
       FROM market_listings
       WHERE season_id = $1
       GROUP BY listed_at
       ORDER BY listed_at`,
      [seasonId]
    ),
    pgClient.query(
      `SELECT
        (SELECT COUNT(*) FROM finances WHERE season_id = $1 AND type = 'round_bonus')::int AS raw_finance_rows,
        (SELECT COUNT(*) FROM (
          SELECT DISTINCT user_id, round_id, date, type, amount, description
          FROM finances WHERE season_id = $1 AND type = 'round_bonus'
        ) f)::int AS unique_finance_events,
        (SELECT COUNT(*) FROM fichajes WHERE season_id = $1)::int AS transfers,
        (SELECT COUNT(*) FROM initial_squads WHERE season_id = $1)::int AS initial_squad_rows,
        (SELECT COUNT(*) FROM market_values WHERE season_id = $1)::int AS market_value_rows,
        (SELECT COUNT(DISTINCT listed_at) FROM market_listings WHERE season_id = $1)::int AS market_snapshot_days,
        (SELECT COUNT(*) FROM player_seasons WHERE season_id = $1)::int AS total_players`,
      [seasonId]
    ),
  ]);

  const countRow = counts.rows[0];
  return {
    users: users.rows,
    userRounds: userRounds.rows,
    lineups: lineups.rows,
    playerStats: playerStats.rows,
    finances: finances.rows,
    initialSquads: initialSquads.rows,
    transfers: transfers.rows,
    marketValues: marketValues.rows,
    marketListings: marketListings.rows,
    counts: {
      rawFinanceRows: Number(countRow.raw_finance_rows),
      uniqueFinanceEvents: Number(countRow.unique_finance_events),
      transfers: Number(countRow.transfers),
      initialSquadRows: Number(countRow.initial_squad_rows),
      marketValueRows: Number(countRow.market_value_rows),
      marketSnapshotDays: Number(countRow.market_snapshot_days),
      totalPlayers: Number(countRow.total_players),
    },
  };
}
