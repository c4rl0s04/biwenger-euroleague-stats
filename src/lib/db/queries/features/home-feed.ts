import 'server-only';

import type { HomeFeedCursor } from '@/lib/home/cursor';
import type { HomeActivityFilter } from '@/lib/home/contracts';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { db as pgClient } from '@/lib/db/client';

export type HomeActivityRowType =
  | 'transfer_day'
  | 'round_completed'
  | 'admin_bonus'
  | 'match_session';

export interface HomeActivityRow {
  id: string;
  type: HomeActivityRowType;
  occurred_at: Date | string;
  payload: Record<string, unknown>;
}

interface QueryHomeActivityRowsInput {
  cursor?: HomeFeedCursor | null;
  filter: HomeActivityFilter;
  limit: number;
}

/**
 * Reads one stable page of normalized league activity for the configured season.
 * The cursor predicate mirrors the final sort so equal timestamps cannot skip rows.
 */
export async function queryHomeActivityRows({
  cursor = null,
  filter,
  limit,
}: QueryHomeActivityRowsInput): Promise<HomeActivityRow[]> {
  const seasonId = await resolveReadSeasonId();
  const filteredType: HomeActivityRowType | null =
    filter === 'transfers'
      ? 'transfer_day'
      : filter === 'rounds'
        ? 'round_completed'
        : filter === 'bonuses'
          ? 'admin_bonus'
          : filter === 'results'
            ? 'match_session'
            : null;

  const query = `
    WITH deduplicated_finances AS (
      SELECT DISTINCT
        user_id,
        round_id,
        date,
        type,
        amount,
        COALESCE(description, '') AS description
      FROM finances
      WHERE season_id = $1
    ),
    round_bonus_by_user AS (
      SELECT
        round_id,
        user_id,
        SUM(COALESCE(amount, 0))::bigint AS bonus,
        MAX(NULLIF(date, '')::timestamptz) AS occurred_at
      FROM deduplicated_finances
      WHERE type = 'round_bonus' AND round_id IS NOT NULL
      GROUP BY round_id, user_id
    ),
    round_rankings AS (
      SELECT
        ur.round_id,
        COALESCE(ur.round_name, 'Jornada ' || ur.round_id::text) AS round_name,
        ur.user_id,
        COALESCE(us.name, u.name, 'Manager') AS user_name,
        COALESCE(us.icon, u.icon) AS user_icon,
        COALESCE(us.color_index, u.color_index, 0) AS color_index,
        COALESCE(ur.points, 0)::int AS points,
        RANK() OVER (
          PARTITION BY ur.round_id
          ORDER BY COALESCE(ur.points, 0) DESC
        )::int AS position
      FROM user_rounds ur
      LEFT JOIN user_seasons us
        ON us.season_id = ur.season_id AND us.user_id = ur.user_id
      LEFT JOIN users u ON u.id = ur.user_id
      WHERE ur.season_id = $1 AND COALESCE(ur.participated, TRUE) = TRUE
    ),
    round_events AS (
      SELECT
        'round_completed:' || rr.round_id::text AS id,
        'round_completed'::text AS type,
        COALESCE(
          MAX(rb.occurred_at),
          MAX(m.finished_at)
        ) AS occurred_at,
        jsonb_build_object(
          'roundId', rr.round_id,
          'roundName', MAX(rr.round_name),
          'totalBonus', COALESCE(SUM(rb.bonus), 0),
          'participants', jsonb_agg(
            jsonb_build_object(
              'userId', rr.user_id,
              'name', rr.user_name,
              'icon', rr.user_icon,
              'colorIndex', rr.color_index,
              'position', rr.position,
              'points', rr.points,
              'bonus', COALESCE(rb.bonus, 0)
            ) ORDER BY rr.position, rr.user_name
          )
        ) AS payload
      FROM round_rankings rr
      LEFT JOIN round_bonus_by_user rb
        ON rb.round_id = rr.round_id AND rb.user_id = rr.user_id
      LEFT JOIN (
        SELECT
          round_id,
          MAX(date) AS finished_at,
          BOOL_AND(status = 'finished') AS fully_finished
        FROM matches
        WHERE season_id = $1
        GROUP BY round_id
      ) m ON m.round_id = rr.round_id
      GROUP BY rr.round_id
      HAVING MAX(rb.occurred_at) IS NOT NULL OR BOOL_AND(COALESCE(m.fully_finished, FALSE))
    ),
    transfer_rows AS (
      SELECT
        f.id AS transfer_id,
        COALESCE(
          to_timestamp(f.timestamp),
          NULLIF(f.fecha, '')::timestamptz
        ) AS occurred_at,
        (COALESCE(
          to_timestamp(f.timestamp),
          NULLIF(f.fecha, '')::timestamptz
        ) AT TIME ZONE 'Europe/Madrid')::date AS local_date,
        f.player_id,
        COALESCE(p.name, 'Jugador') AS player_name,
        p.position,
        p.img AS player_image,
        t.code AS team_code,
        seller.user_id AS seller_id,
        COALESCE(seller.name, seller_user.name, NULLIF(f.vendedor, ''), 'Mercado') AS seller_name,
        COALESCE(seller.icon, seller_user.icon) AS seller_icon,
        COALESCE(seller.color_index, seller_user.color_index, 0) AS seller_color_index,
        buyer.user_id AS buyer_id,
        COALESCE(buyer.name, buyer_user.name, NULLIF(f.comprador, ''), 'Mercado') AS buyer_name,
        COALESCE(buyer.icon, buyer_user.icon) AS buyer_icon,
        COALESCE(buyer.color_index, buyer_user.color_index, 0) AS buyer_color_index,
        COALESCE(f.precio, 0) AS amount,
        historical_value.price AS market_value,
        historical_value.date AS market_value_at
      FROM fichajes f
      LEFT JOIN players p ON p.id = f.player_id
      LEFT JOIN player_seasons ps
        ON ps.season_id = f.season_id AND ps.player_id = f.player_id
      LEFT JOIN teams t ON t.id = COALESCE(ps.team_id, p.team_id)
      LEFT JOIN user_seasons seller
        ON seller.season_id = f.season_id AND lower(seller.name) = lower(f.vendedor)
      LEFT JOIN user_seasons buyer
        ON buyer.season_id = f.season_id AND lower(buyer.name) = lower(f.comprador)
      LEFT JOIN users seller_user ON seller_user.id = seller.user_id
      LEFT JOIN users buyer_user ON buyer_user.id = buyer.user_id
      LEFT JOIN LATERAL (
        SELECT mv.price, mv.date
        FROM market_values mv
        WHERE mv.season_id = f.season_id
          AND mv.player_id = f.player_id
          AND mv.date <= (
            COALESCE(
              to_timestamp(f.timestamp),
              NULLIF(f.fecha, '')::timestamptz
            ) AT TIME ZONE 'Europe/Madrid'
          )::date
        ORDER BY mv.date DESC, mv.id DESC
        LIMIT 1
      ) historical_value ON TRUE
      WHERE f.season_id = $1
    ),
    transfer_events AS (
      SELECT
        'transfer_day:' || to_char(local_date, 'YYYY-MM-DD') AS id,
        'transfer_day'::text AS type,
        MAX(occurred_at) AS occurred_at,
        jsonb_build_object(
          'date', to_char(local_date, 'YYYY-MM-DD'),
          'transfers', jsonb_agg(
            jsonb_build_object(
              'id', 'transfer:' || transfer_id::text,
              'occurredAt', occurred_at,
              'playerId', player_id,
              'playerName', player_name,
              'position', position,
              'playerImage', player_image,
              'teamCode', team_code,
              'sellerId', seller_id,
              'sellerName', seller_name,
              'sellerIcon', seller_icon,
              'sellerColorIndex', seller_color_index,
              'buyerId', buyer_id,
              'buyerName', buyer_name,
              'buyerIcon', buyer_icon,
              'buyerColorIndex', buyer_color_index,
              'amount', amount,
              'marketValue', market_value,
              'marketValueAt', CASE
                WHEN market_value_at IS NULL THEN NULL
                ELSE to_char(market_value_at, 'YYYY-MM-DD')
              END
            ) ORDER BY occurred_at DESC, transfer_id DESC
          )
        ) AS payload
      FROM transfer_rows
      WHERE occurred_at IS NOT NULL
      GROUP BY local_date
    ),
    admin_bonus_events AS (
      SELECT
        'admin_bonus:' || md5(concat_ws('|', df.user_id, df.round_id, df.date, df.type, df.amount, df.description)) AS id,
        'admin_bonus'::text AS type,
        NULLIF(date, '')::timestamptz AS occurred_at,
        jsonb_build_object(
          'recipientId', df.user_id,
          'recipientName', COALESCE(us.name, u.name, 'Manager'),
          'icon', COALESCE(us.icon, u.icon),
          'colorIndex', COALESCE(us.color_index, u.color_index, 0),
          'amount', COALESCE(df.amount, 0),
          'description', COALESCE(NULLIF(df.description, ''), 'Prima administrativa')
        ) AS payload
      FROM deduplicated_finances df
      LEFT JOIN user_seasons us
        ON us.season_id = $1 AND us.user_id = df.user_id
      LEFT JOIN users u ON u.id = df.user_id
      WHERE df.type <> 'round_bonus' OR df.round_id IS NULL
    ),
    match_session_events AS (
      SELECT
        'match_session:' || m.round_id::text || ':' ||
          to_char((m.date AT TIME ZONE 'Europe/Madrid')::date, 'YYYY-MM-DD') AS id,
        'match_session'::text AS type,
        MAX(m.date) AS occurred_at,
        jsonb_build_object(
          'roundId', m.round_id,
          'roundName', COALESCE(MAX(m.round_name), 'Jornada ' || m.round_id::text),
          'sessionDate', to_char((m.date AT TIME ZONE 'Europe/Madrid')::date, 'YYYY-MM-DD'),
          'matches', jsonb_agg(
            jsonb_build_object(
              'id', m.id,
              'homeId', home.id,
              'homeName', home.name,
              'homeCode', home.code,
              'homeImage', home.img,
              'homeScore', COALESCE(m.home_score, 0),
              'awayId', away.id,
              'awayName', away.name,
              'awayCode', away.code,
              'awayImage', away.img,
              'awayScore', COALESCE(m.away_score, 0)
            ) ORDER BY m.date, m.id
          )
        ) AS payload
      FROM matches m
      JOIN teams home ON home.id = m.home_id
      JOIN teams away ON away.id = m.away_id
      WHERE m.season_id = $1 AND m.status = 'finished'
      GROUP BY m.round_id, (m.date AT TIME ZONE 'Europe/Madrid')::date
    ),
    activity AS (
      SELECT * FROM transfer_events
      UNION ALL SELECT * FROM round_events
      UNION ALL SELECT * FROM admin_bonus_events
      UNION ALL SELECT * FROM match_session_events
    )
    SELECT id, type, occurred_at, payload
    FROM activity
    WHERE occurred_at IS NOT NULL
      AND ($4::text IS NULL OR type = $4::text)
      AND (
        $2::timestamptz IS NULL
        OR occurred_at < $2::timestamptz
        OR (occurred_at = $2::timestamptz AND id < $3::text)
      )
    ORDER BY occurred_at DESC, id DESC
    LIMIT $5
  `;

  const result = await pgClient.query(query, [
    seasonId,
    cursor?.occurredAt ?? null,
    cursor?.id ?? null,
    filteredType,
    limit,
  ]);

  return result.rows as HomeActivityRow[];
}
