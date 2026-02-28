import { Pool } from 'pg';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient =
  | Pool
  | {
      query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
    };

// ==========================================
// INTERFACES
// ==========================================

export interface UpsertMarketListingParams {
  player_id: number;
  listed_at: string; // ISO date string: 'YYYY-MM-DD'
  price: number;
  seller_id: string | null;
}

export interface MarketListingMutations {
  upsertMarketListing: (params: UpsertMarketListingParams) => Promise<void>;
}

/**
 * Market Listings Mutations (Postgres)
 * Handles write operations for the market_listings table.
 * Each row is a daily snapshot of a player available on the fantasy market.
 */
export function prepareMarketListingMutations(db: DbClient): MarketListingMutations {
  return {
    /**
     * Upsert a single market listing entry.
     * If the same player already has a listing for today, update price and seller info.
     */
    upsertMarketListing: async (params: UpsertMarketListingParams) => {
      const sql = `
        INSERT INTO market_listings (player_id, listed_at, price, seller_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (player_id, listed_at)
        DO UPDATE SET
          price       = EXCLUDED.price,
          seller_id   = EXCLUDED.seller_id
      `;
      await db.query(sql, [
        params.player_id,
        params.listed_at,
        params.price,
        params.seller_id,
      ]);
    },
  };
}
