import { fetchMarketListings } from '../../../api/biwenger-client';
import { prepareMarketListingMutations } from '../../../db/mutations/market-listings';
import type { SyncManager } from '../../manager';

export interface BiwengerMarketDependencies {
  fetchMarketListings: typeof fetchMarketListings;
}

const defaultDependencies: BiwengerMarketDependencies = {
  fetchMarketListings,
};

export interface BiwengerMarketSyncResult {
  summary: string;
  counts: {
    listings: number;
    skipped: number;
  };
}

/**
 * Biwenger market rolls over at 5:00 AM (Spanish time).
 * To handle syncs between 00:00 and 04:59, we subtract 5 hours from the current date.
 */
export function resolveMarketDate(now = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0];
}

export async function syncBiwengerMarket(
  manager: SyncManager,
  overrides?: Partial<BiwengerMarketDependencies>
): Promise<BiwengerMarketSyncResult> {
  const deps = { ...defaultDependencies, ...overrides };
  manager.log('🛒 Syncing Market Listings...');

  const db = manager.context.db;
  const mutations = prepareMarketListingMutations(db as any, {
    seasonId: manager.context.seasonId,
  });

  const marketDate = resolveMarketDate();
  manager.log(`   > Fetching active market listings for market day ${marketDate}...`);
  const response = await deps.fetchMarketListings();

  const items: any[] = response?.data?.sales ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    manager.log('   > No players currently listed on the market.');
    await mutations.deleteStaleMarketListings(marketDate, []);
    return {
      summary: 'Biwenger market snapshot synchronized.',
      counts: { listings: 0, skipped: 0 },
    };
  }

  manager.log(`   > Found ${items.length} player(s) on the market. Upserting...`);

  let upserted = 0;
  let skipped = 0;

  for (const item of items) {
    const playerId: number | undefined =
      typeof item.player === 'object' ? item.player?.id : item.player;

    if (!playerId) {
      skipped++;
      continue;
    }

    const price: number = item.price ?? item.value ?? 0;
    const sellerId: string | null = item.user?.id ? String(item.user.id) : null;

    await mutations.upsertMarketListing({
      player_id: playerId,
      listed_at: marketDate,
      price,
      seller_id: sellerId,
    });

    upserted++;
  }

  const activeListings = items
    .map((item) => {
      const pId = typeof item.player === 'object' ? item.player?.id : item.player;
      const sId = item.user?.id ? String(item.user.id) : null;
      return { player_id: pId, seller_id: sId };
    })
    .filter(
      (l): l is { player_id: number; seller_id: string | null } =>
        typeof l.player_id === 'number' && !isNaN(l.player_id)
    );

  manager.log(`   > Cleaning up any stale listings for today...`);
  await mutations.deleteStaleMarketListings(marketDate, activeListings);

  manager.log(
    `✅ Market listings synced: ${upserted} upserted, ${skipped} skipped. Stale listings removed.`
  );
  return {
    summary: 'Biwenger market snapshot synchronized.',
    counts: { listings: upserted, skipped },
  };
}
