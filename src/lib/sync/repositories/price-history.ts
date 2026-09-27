import type { QueryResultRow } from 'pg';
import {
  PRICE_HISTORY_CHECKPOINT_PREFIX,
  priceHistoryBoundsKey,
  priceHistoryCheckpointKey,
  type HistoricalPrice,
  type PriceHistoryBounds,
  type PriceHistoryCounts,
} from '../price-history';

export interface PriceHistoryPlayer {
  playerId: number;
  checkedAt: string | null;
  checkpointBounds: string | null;
}

export interface PriceHistoryRepository {
  invalidateCheckpoints(seasonId: string, playerIds: number[]): Promise<void>;
  load(seasonId: string): Promise<{ bounds: PriceHistoryBounds; players: PriceHistoryPlayer[] }>;
  reconcile(
    seasonId: string,
    playerId: number,
    prices: HistoricalPrice[],
    bounds: PriceHistoryBounds,
    checkedAt: string
  ): Promise<PriceHistoryCounts>;
}

export interface PriceHistoryDb {
  query<R extends QueryResultRow>(sql: string, values?: unknown[]): Promise<{ rows: R[] }>;
}

/** Called under SyncManager's advisory lock and writable-season guard. */
export function createPriceHistoryRepository(db: PriceHistoryDb): PriceHistoryRepository {
  return {
    async invalidateCheckpoints(seasonId, playerIds) {
      if (!playerIds.length) return;
      await db.query('DELETE FROM sync_meta WHERE key = ANY($1::text[])', [
        playerIds.map((id) => priceHistoryCheckpointKey(seasonId, id)),
      ]);
    },
    async load(seasonId) {
      const season = await db.query<{ starts_at: string; ends_at: string | null }>(
        'SELECT starts_at::text, ends_at::text FROM seasons WHERE id = $1',
        [seasonId]
      );
      if (!season.rows[0]) throw new Error('Price history season was not found.');
      const result = await db.query<{
        player_id: number;
        updated_at: string | null;
        value: string | null;
      }>(
        `SELECT ps.player_id, sm.updated_at, sm.value
         FROM player_seasons ps
         LEFT JOIN sync_meta sm ON sm.key = $2 || ps.player_id::text
         WHERE ps.season_id = $1 ORDER BY ps.player_id`,
        [seasonId, `${PRICE_HISTORY_CHECKPOINT_PREFIX}${seasonId}:`]
      );
      return {
        bounds: { startsAt: season.rows[0].starts_at, endsAt: season.rows[0].ends_at },
        players: result.rows.map((row) => ({
          playerId: row.player_id,
          checkedAt: row.updated_at,
          checkpointBounds: row.value,
        })),
      };
    },
    async reconcile(seasonId, playerId, prices, bounds, checkedAt) {
      // One atomic statement: a failed price write cannot leave a successful checkpoint.
      // Counts use the pre-write snapshot; unchanged rows are not updated and absent dates survive.
      const result = await db.query<PriceHistoryCounts>(
        `WITH incoming AS MATERIALIZED (
           SELECT date, price FROM unnest($3::date[], $4::integer[]) AS p(date, price)
         ), counts AS MATERIALIZED (
           SELECT COUNT(*) FILTER (WHERE mv.date IS NULL)::int AS inserted,
             COUNT(*) FILTER (WHERE mv.date IS NOT NULL AND mv.price IS DISTINCT FROM i.price)::int AS corrected,
             COUNT(*) FILTER (WHERE mv.date IS NOT NULL AND mv.price IS NOT DISTINCT FROM i.price)::int AS unchanged
           FROM incoming i LEFT JOIN market_values mv
             ON mv.season_id = $1 AND mv.player_id = $2 AND mv.date = i.date
         ), written AS (
           INSERT INTO market_values (season_id, player_id, date, price)
           SELECT $1, $2, date, price FROM incoming
           ON CONFLICT (season_id, player_id, date) DO UPDATE SET price = EXCLUDED.price
           WHERE market_values.price IS DISTINCT FROM EXCLUDED.price
           RETURNING 1
         ), checkpoint AS (
           INSERT INTO sync_meta (key, value, updated_at)
           SELECT $5, $6, $7 FROM (SELECT COUNT(*) FROM written) w
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
           RETURNING key
         ) SELECT counts.* FROM counts CROSS JOIN checkpoint`,
        [
          seasonId,
          playerId,
          prices.map((price) => price.date),
          prices.map((price) => price.price),
          priceHistoryCheckpointKey(seasonId, playerId),
          priceHistoryBoundsKey(bounds),
          checkedAt,
        ]
      );
      return result.rows[0];
    },
  };
}
