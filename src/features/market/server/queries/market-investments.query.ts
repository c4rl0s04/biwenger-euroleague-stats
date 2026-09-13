import 'server-only';
import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
export async function readBestRevaluation(): Promise<BestRevaluationRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      t.name as team_name,
      t.img as team_logo,
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      COALESCE(ps.price, p.price) as current_price,
      f.precio as purchase_price,
      (COALESCE(ps.price, p.price) - f.precio) as revaluation
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    JOIN fichajes f ON p.id = f.player_id AND f.season_id = ps.season_id AND ps.owner_id IS NOT NULL
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    JOIN users u ON ps.owner_id = u.id
    -- Find the *last* purchase for this player by the CURRENT owner
    WHERE f.id = (
      SELECT id FROM fichajes
      WHERE season_id = ps.season_id AND player_id = p.id AND comprador = u.name
      ORDER BY timestamp DESC LIMIT 1
    )
    AND ps.season_id = $1
    AND (COALESCE(ps.price, p.price) - f.precio) > 0
    ORDER BY revaluation DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBestValuePlayer(): Promise<BestValuePlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      WHERE season_id = $1
      GROUP BY round_id
    )
    SELECT
      curr_owner.id as user_id,
      COALESCE(us.name, curr_owner.name) as user_name,
      COALESCE(us.color_index, curr_owner.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,

      f.id as transfer_id,
      f.precio as purchase_price,

      -- Calculate total points earned in valid rounds
      (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          AND prs.season_id = $1
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
          AND prs.season_id = $1
          AND to_timestamp(f.timestamp) < rs.start_date
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      )::float * 1000000 / NULLIF(f.precio, 0) as points_per_million

    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    JOIN users curr_owner ON curr_owner.id = us.user_id

    LEFT JOIN LATERAL (
        SELECT timestamp
        FROM fichajes s
        WHERE s.season_id = f.season_id
          AND s.player_id = f.player_id
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE f.season_id = $1
      AND f.precio > 100000
      AND f.comprador != 'Mercado'
      AND (
        SELECT COALESCE(SUM(prs.fantasy_points), 0)
        FROM player_round_stats prs
        JOIN RoundStarts rs ON rs.round_id = prs.round_id
        WHERE prs.player_id = p.id
          AND prs.season_id = $1
          AND to_timestamp(f.timestamp) < rs.start_date
          AND (
             sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date
          )
      ) > 0

    ORDER BY points_per_million DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readInfirmaryPlayers(): Promise<InfirmaryPlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH RoundStarts AS (
      SELECT round_id, MIN(date) as start_date
      FROM matches
      WHERE season_id = $1
      GROUP BY round_id
    ),
    TargetPlayers AS (
      SELECT
        p.id as player_id,
        p.name as player_name,
        p.img as player_img,
        COALESCE(ps.team_id, p.team_id) as team_id,
        t.code as player_team,
        u.id as user_id,
        u.name as user_name,
        u.color_index as user_color_index,
        f.precio as purchase_price,
        to_timestamp(f.timestamp) as signed_at
      FROM player_seasons ps
      JOIN players p ON ps.player_id = p.id
      JOIN users u ON ps.owner_id = u.id
      LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
      JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes f2
        WHERE f2.season_id = ps.season_id
          AND f2.player_id = p.id
          AND f2.comprador = u.name
        ORDER BY timestamp DESC
        LIMIT 1
      ) f ON true
      WHERE ps.season_id = $1
        AND f.precio > 2000000
    ),
    TeamRounds AS (
      SELECT
        tp.player_id,
        count(DISTINCT m.round_id) as total_team_rounds
      FROM TargetPlayers tp
      JOIN matches m ON (m.home_id = tp.team_id OR m.away_id = tp.team_id)
      WHERE m.season_id = $1
        AND m.date >= tp.signed_at::date
        AND m.date < NOW()
      GROUP BY tp.player_id
    ),
    PlayedRounds AS (
      SELECT
        tp.player_id,
        count(DISTINCT prs.round_id) as played_rounds
      FROM TargetPlayers tp
      JOIN player_round_stats prs ON prs.player_id = tp.player_id
      JOIN RoundStarts rs ON rs.round_id = prs.round_id
      WHERE prs.season_id = $1
        AND rs.start_date >= tp.signed_at
      GROUP BY tp.player_id
    )
    SELECT
      tp.player_id,
      tp.player_name,
      tp.player_img,
      tp.player_team,
      tp.user_id,
      tp.user_name,
      tp.user_color_index,
      tp.purchase_price,
      COALESCE(tr.total_team_rounds, 0) as available_rounds,
      COALESCE(pr.played_rounds, 0) as played_rounds,
      (COALESCE(tr.total_team_rounds, 0) - COALESCE(pr.played_rounds, 0)) as missed_rounds
    FROM TargetPlayers tp
    LEFT JOIN TeamRounds tr ON tp.player_id = tr.player_id
    LEFT JOIN PlayedRounds pr ON tp.player_id = pr.player_id
    WHERE COALESCE(tr.total_team_rounds, 0) >= 3
    ORDER BY missed_rounds DESC, available_rounds ASC;
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBestSingleFlip(): Promise<SingleFlipRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,

      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit

    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON purchase.player_id = p.id

    -- Join with the sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1
      AND purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) > 0
    ORDER BY profit DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readWorstSingleFlip(): Promise<SingleFlipRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,

      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit

    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON purchase.player_id = p.id

    -- Join with the sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1
      AND purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) < 0
    ORDER BY profit ASC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readBestPercentageGain(): Promise<PercentageGainRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      COALESCE(ps.price, p.price) as current_price,

      f.precio as purchase_price,
      ((COALESCE(ps.price, p.price) - f.precio)::float / NULLIF(f.precio, 0)) * 100 as percentage_gain

    FROM fichajes f
    JOIN user_seasons us ON us.name = f.comprador AND us.season_id = f.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON f.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = f.season_id

    -- Ensure player is still owned by this purchase (no subsequent sale)
    LEFT JOIN LATERAL (
        SELECT timestamp
        FROM fichajes s
        WHERE s.season_id = f.season_id
          AND s.player_id = f.player_id
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        LIMIT 1
    ) sale ON true

    WHERE f.season_id = $1
      AND f.comprador != 'Mercado'
      AND sale.timestamp IS NULL
      AND (COALESCE(ps.price, p.price) - f.precio) > 0
      AND f.precio > 150000

    ORDER BY percentage_gain DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readMissedOpportunity(): Promise<MissedOpportunityRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH LatestSales AS (
      SELECT DISTINCT ON (vendedor, player_id)
        vendedor as user_name,
        player_id,
        precio as sale_price,
        timestamp as sale_timestamp
      FROM fichajes
      WHERE season_id = $1 AND vendedor != 'Mercado'
      ORDER BY vendedor, player_id, timestamp DESC
    ),
    LatestPurchases AS (
      SELECT DISTINCT ON (comprador, player_id)
        comprador as user_name,
        player_id,
        precio as purchase_price,
        timestamp as purchase_timestamp
      FROM fichajes
      WHERE season_id = $1 AND comprador != 'Mercado'
      ORDER BY comprador, player_id, timestamp DESC
    )
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,

      ls.sale_price,
      CASE
        WHEN ps.owner_id = u.id THEN lp.purchase_price
        ELSE COALESCE(ps.price, p.price)
      END as current_price,

      (ps.owner_id = u.id) as is_repurchase,

      CASE
        WHEN ps.owner_id = u.id THEN (lp.purchase_price - ls.sale_price)
        ELSE (COALESCE(ps.price, p.price) - ls.sale_price)
      END as missed_profit

    FROM LatestSales ls
    JOIN users u ON ls.user_name = u.name
    JOIN players p ON ls.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN LatestPurchases lp ON ls.user_name = lp.user_name
      AND ls.player_id = lp.player_id
      AND lp.purchase_timestamp > ls.sale_timestamp

    WHERE
      -- Case 1: Not owned and market price rose since sale
      (ps.owner_id != u.id AND COALESCE(ps.price, p.price) > ls.sale_price)
      OR
      -- Case 2: Currently owned and repurchase price was higher than sale price
      (ps.owner_id = u.id AND lp.purchase_price > ls.sale_price)

    ORDER BY missed_profit DESC
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readTopTrader(): Promise<TopTraderRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_profit

    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id

    -- Join with the subsequent sale
    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1 AND purchase.comprador != 'Mercado'
    GROUP BY u.id, u.name, u.color_index, us.name, us.color_index
    ORDER BY trade_count DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readProfitablePlayer(): Promise<ProfitablePlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_profit

    FROM fichajes purchase
    JOIN players p ON purchase.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = purchase.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id

    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1 AND purchase.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img, t.code
    HAVING SUM(sale.precio - purchase.precio) > 0
    ORDER BY total_profit DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readLossyPlayer(): Promise<LossyPlayerRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      COUNT(*) as trade_count,
      SUM(sale.precio - purchase.precio) as total_loss

    FROM fichajes purchase
    JOIN players p ON purchase.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = purchase.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id

    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1 AND purchase.comprador != 'Mercado'
    GROUP BY p.id, p.name, p.img, t.code
    HAVING SUM(sale.precio - purchase.precio) < 0
    ORDER BY total_loss ASC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readQuickestFlip(): Promise<QuickFlipRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,

      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit,
      (sale.timestamp - purchase.timestamp) / 3600.0 as hours_held

    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON purchase.player_id = p.id

    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1
      AND purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) > 0
    ORDER BY (sale.timestamp - purchase.timestamp) ASC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readLongestProfitableHold(): Promise<LongHoldRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,

      p.id as player_id,
      p.name as player_name,
      p.img as player_img,

      purchase.precio as purchase_price,
      sale.precio as sale_price,
      (sale.precio - purchase.precio) as profit,
      (sale.timestamp - purchase.timestamp) / 86400.0 as days_held

    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON purchase.player_id = p.id

    JOIN LATERAL (
        SELECT precio, timestamp
        FROM fichajes s
        WHERE s.season_id = purchase.season_id
          AND s.player_id = purchase.player_id
          AND s.vendedor = purchase.comprador
          AND s.timestamp > purchase.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    WHERE purchase.season_id = $1
      AND purchase.comprador != 'Mercado'
      AND (sale.precio - purchase.precio) > 0
    ORDER BY (sale.timestamp - purchase.timestamp) DESC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
export async function readWorstRevaluation(): Promise<DevaluationRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id as user_id,
      COALESCE(us.name, u.name) as user_name,
      COALESCE(us.color_index, u.color_index, 0) as user_color_index,
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      t.code as player_team,
      t.name as team_name,
      t.img as team_logo,
      COALESCE(ps.price, p.price) as current_price,
      purchase.precio as purchase_price,
      (COALESCE(ps.price, p.price) - purchase.precio) as devaluation
    FROM fichajes purchase
    JOIN user_seasons us ON us.name = purchase.comprador AND us.season_id = purchase.season_id
    JOIN users u ON u.id = us.user_id
    JOIN players p ON purchase.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = purchase.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE purchase.season_id = $1
      AND (COALESCE(ps.price, p.price) - purchase.precio) < 0
      AND purchase.comprador != 'Mercado'
      AND NOT EXISTS (
          SELECT 1 FROM fichajes s
          WHERE s.season_id = purchase.season_id
            AND s.player_id = purchase.player_id
            AND s.vendedor = purchase.comprador
            AND s.timestamp > purchase.timestamp
      )
      AND COALESCE(ps.price, p.price) < purchase.precio
    ORDER BY devaluation ASC

  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
import type {
  BestRevaluationRecord,
  BestValuePlayerRecord,
  InfirmaryPlayerRecord,
  SingleFlipRecord,
  PercentageGainRecord,
  MissedOpportunityRecord,
  TopTraderRecord,
  ProfitablePlayerRecord,
  LossyPlayerRecord,
  QuickFlipRecord,
  LongHoldRecord,
  DevaluationRecord,
} from './market-investments.records';
