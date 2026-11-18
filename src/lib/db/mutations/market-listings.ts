import { CONFIG } from '../../config';

export interface MarketListing {
  player_id: number;
  price: number;
  seller_id: string | null;
}

export function prepareMarketListingMutations(
  db: { query: (sql: string, params: unknown[]) => Promise<unknown> },
  options: { seasonId?: string } = {}
) {
  const seasonId = options.seasonId ?? CONFIG.SEASON.ID;

  return {
    async replaceMarketSnapshot(listedAt: string, listings: MarketListing[]): Promise<void> {
      // The incoming and stale rows are disjoint, so one statement updates the snapshot atomically.
      await db.query(
        `WITH incoming AS (
           SELECT player_id, price, seller_id
           FROM jsonb_to_recordset($3::jsonb) AS listing(player_id integer, price integer, seller_id text)
         ), upserted AS (
           INSERT INTO market_listings (season_id, player_id, listed_at, price, seller_id)
           SELECT $1, player_id, $2, price, seller_id FROM incoming
           ON CONFLICT (season_id, player_id, listed_at)
           DO UPDATE SET price = EXCLUDED.price, seller_id = EXCLUDED.seller_id
         )
         DELETE FROM market_listings AS existing
         WHERE existing.season_id = $1 AND existing.listed_at = $2
           AND NOT EXISTS (
             SELECT 1 FROM incoming WHERE incoming.player_id = existing.player_id
           )`,
        [seasonId, listedAt, JSON.stringify(listings)]
      );
    },
  };
}
