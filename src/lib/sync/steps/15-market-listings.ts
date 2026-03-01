import { fetchMarketListings } from '../../api/biwenger-client';
import { prepareMarketListingMutations } from '../../db/mutations/market-listings';
import { SyncManager } from '../manager';

/**
 * Syncs the current market snapshot: players listed for sale on the fantasy market.
 * Runs daily. One row per player per date in `market_listings`.
 */
export async function run(manager: SyncManager): Promise<void> {
  manager.log('🛒 Syncing Market Listings...');

  try {
    const db = manager.context.db;
    const mutations = prepareMarketListingMutations(db as any);

    // Biwenger market rolls over at 5:00 AM (Spanish time)
    // To handle syncs between 00:00 and 04:59, we subtract 5 hours from the current date.
    // If it's currently March 1st 03:00, this correctly attributes it to February 28th.
    const now = new Date();
    const marketDate = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0];

    manager.log(`   > Fetching active market listings for market day ${marketDate}...`);
    const response = await fetchMarketListings();

    // The Biwenger market endpoint returns { data: [...] }
    // Each entry shape (observed): { player: { id, name, ... }, price, user: { id, name } | null }
    const items: any[] = response?.data?.sales ?? [];

    console.log('\n--- DEBUG MARKET RESPONSE ---');
    console.log('Total items fetched:', items?.length);
    console.log('First 2 raw items from payload to verify structure:', JSON.stringify(items?.slice(0, 2), null, 2));
    console.log('-----------------------------\n');

    if (!Array.isArray(items) || items.length === 0) {
      manager.log('   > No players currently listed on the market.');
      return;
    }

    manager.log(`   > Found ${items.length} player(s) on the market. Upserting...`);

    let upserted = 0;
    let skipped = 0;

    for (const item of items) {
      // Resolve player id — can be a number directly or nested in `player.id`
      const playerId: number | undefined =
        typeof item.player === 'object' ? item.player?.id : item.player;

      if (!playerId) {
        skipped++;
        continue;
      }

      const price: number = item.price ?? item.value ?? 0;

      // Seller is the current owner putting the player on the market.
      // Can be null if it's a free agent pulled by the system.
      const sellerId: string | null = item.user?.id ? String(item.user.id) : null;

      await mutations.upsertMarketListing({
        player_id: playerId,
        listed_at: marketDate,
        price,
        seller_id: sellerId,
      });

      console.log(`[DEBUG Syncing] Valid Player: ID=${playerId} | Price=${price} | Seller=${sellerId || 'Biwenger System'}`);

      upserted++;
    }

    manager.log(`✅ Market listings synced: ${upserted} upserted, ${skipped} skipped.`);
  } catch (error) {
    manager.log(`❌ Error syncing market listings: ${error}`);
    throw error;
  }
}
