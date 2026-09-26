import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  MarketTransferRecord,
  MarketTransferPageRecords,
  MarketValueDetailRecord,
  MarketDuelDetailRecord,
} from './market-transfer.records';

interface LiveMarketTransfersQueryParams {
  page?: number;
  limit?: number;
  buyer?: string;
  seller?: string;
}

export async function readMarketTransferPage({
  page = 1,
  limit = 20,
  buyer = 'all',
  seller = 'all',
}: LiveMarketTransfersQueryParams): Promise<MarketTransferPageRecords> {
  const seasonId = await resolveReadSeasonId();
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE f.season_id = $1 AND f.precio > 0';
  const params: (string | number)[] = [seasonId];
  let paramIndex = 2;

  if (buyer && buyer !== 'all' && buyer !== 'Todos') {
    whereClause += ` AND f.comprador ILIKE '%' || $${paramIndex} || '%'`;
    params.push(buyer);
    paramIndex++;
  }

  if (seller && seller !== 'all' && seller !== 'Todos') {
    whereClause += ` AND f.vendedor ILIKE '%' || $${paramIndex} || '%'`;
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
      vs.user_id as vendedor_id,
      vs.icon as vendedor_icon,
      vs.color_index as vendedor_color_index,
      cs.user_id as comprador_id,
      cs.icon as comprador_icon,
      cs.color_index as comprador_color_index,
      f.player_id,
      p.name as player_name,
      ps.position as player_position,
      p.img as player_img,
      t.code as player_team,
      (SELECT COUNT(*) + 1 FROM transfer_bids tb WHERE tb.transfer_id = f.id) as bids_count
    FROM fichajes f
    LEFT JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams t ON ps.team_id = t.id
    LEFT JOIN user_seasons vs ON vs.name = f.vendedor AND vs.season_id = f.season_id
    LEFT JOIN user_seasons cs ON cs.name = f.comprador AND cs.season_id = f.season_id
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
    pgClient.query(query, params),
    pgClient.query(countQuery, params.slice(0, paramIndex - 1)),
  ]);

  return {
    rows: rowsResult.rows as MarketTransferRecord[],
    total: countResult.rows[0].total as string | number,
    page,
    limit,
  };
}

export async function readMarketValueDetails(
  transferId: number
): Promise<MarketValueDetailRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH purchase AS (
      SELECT
        f.id as transfer_id,
        f.player_id,
        f.comprador,
        f.season_id,
        f.timestamp as start_time,
        f.precio
      FROM fichajes f
      WHERE f.season_id = $2 AND f.id = $1
    ),
    sale AS (
      SELECT
        s.timestamp as end_time
      FROM fichajes s, purchase p
      WHERE s.season_id = p.season_id
        AND s.player_id = p.player_id
        AND s.vendedor = p.comprador
        AND s.timestamp > p.start_time
      ORDER BY s.timestamp ASC
      LIMIT 1
    ),
    RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      WHERE season_id = $2
      GROUP BY round_id
    )
    SELECT
      m.round_name,
      m.date,
      COALESCE(prs.fantasy_points, 0) as points,
      (
         CASE
          WHEN m.home_id = ps.team_id THEN t_away.name
          ELSE t_home.name
         END
      ) as opponent,
      ps.team_id as team_id
    FROM player_round_stats prs
    JOIN purchase p ON prs.player_id = p.player_id
    JOIN players pl ON p.player_id = pl.id
    LEFT JOIN player_seasons ps ON ps.player_id = pl.id AND ps.season_id = p.season_id
    JOIN matches m ON m.season_id = p.season_id
      AND m.round_id = prs.round_id
      AND (m.home_id = ps.team_id OR m.away_id = ps.team_id)
    JOIN RoundStarts rs ON rs.round_id = prs.round_id
    LEFT JOIN teams t_home ON m.home_id = t_home.id
    LEFT JOIN teams t_away ON m.away_id = t_away.id
    LEFT JOIN sale s ON true
    WHERE
      -- Ownership must start BEFORE round lock
      prs.season_id = p.season_id
      AND to_timestamp(p.start_time) < rs.start_date
      -- Must still own player when round starts
      AND (
         s.end_time IS NULL OR to_timestamp(s.end_time) > rs.start_date
      )
    ORDER BY m.date ASC
  `;
  const result = await pgClient.query(query, [transferId, seasonId]);
  return result.rows as MarketValueDetailRecord[];
}

export async function readMarketDuelDetails(
  userId: number,
  opponentId: number
): Promise<MarketDuelDetailRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const normalizedUserId = Math.trunc(userId);
  const normalizedOpponentId = Math.trunc(opponentId);

  const query = `
    SELECT
      f.id as transfer_id,
      f.fecha as transfer_date,
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      winner_season.user_id as winner_id,
      winner_season.name as winner_name,
      winner_season.icon as winner_icon,
      winner_season.color_index as winner_color_index,
      runner_season.user_id as runner_id,
      runner_season.name as runner_name,
      runner_season.icon as runner_icon,
      runner_season.color_index as runner_color_index,
      f.precio as winning_bid,
      second_bid.amount as second_bid,
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
    JOIN players p ON p.id = f.player_id
    WHERE f.season_id = $1
      AND f.comprador != 'Mercado'
      AND (
        (winner_season.user_id = $2 AND runner_season.user_id = $3)
        OR
        (winner_season.user_id = $3 AND runner_season.user_id = $2)
      )
    ORDER BY f.timestamp DESC NULLS LAST, f.id DESC
  `;

  const result = await pgClient.query(query, [
    seasonId,
    String(normalizedUserId),
    String(normalizedOpponentId),
  ]);

  return result.rows as MarketDuelDetailRecord[];
}
