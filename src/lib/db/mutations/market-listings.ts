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
  deleteStaleMarketListings: (
    listedAt: string,
    activeListings: { player_id: number; seller_id: string | null }[]
  ) => Promise<void>;
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
      await db.query(sql, [params.player_id, params.listed_at, params.price, params.seller_id]);
    },

    /**
     * Deletes listings for a given date that are NO LONGER actively on the market.
     */
    deleteStaleMarketListings: async (
      listedAt: string,
      activeListings: { player_id: number; seller_id: string | null }[]
    ) => {
      if (activeListings.length === 0) {
        // If there are no active players, just delete everything for that date
        await db.query(`DELETE FROM market_listings WHERE listed_at = $1`, [listedAt]);
        return;
      }

      // Delete any listing for this date that isn't exactly in our active list
      // Since SQL doesn't easily support NOT IN with pairs, we construct the query carefully
      // or we can fetch what's currently there and delete the diff

      // Simpler approach for Postgres:
      // DELETE FROM market_listings WHERE listed_at = $1 AND (player_id, COALESCE(seller_id, '')) NOT IN ((p1, s1), (p2, s2)...)

      const values = activeListings
        .map((l) => `(${l.player_id}, '${l.seller_id || ''}')`)
        .join(', ');

      const sql = `
        DELETE FROM market_listings 
        WHERE listed_at = $1 
          AND (player_id, COALESCE(seller_id, '')) NOT IN (${values})
      `;

      await db.query(sql, [listedAt]);
    },
  };
}
