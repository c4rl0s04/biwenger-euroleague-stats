import { z } from 'zod';
import { fetchMarketListings } from '../../../api/biwenger-client';
import {
  prepareMarketListingMutations,
  type MarketListing,
} from '../../../db/mutations/market-listings';
import type { SyncManager } from '../../manager';

const playerId = z.int32().positive();
const price = z.int32().nonnegative();
const sale = z.object({
  player: z.union([playerId, z.object({ id: playerId })]),
  price: price.nullish(),
  value: price.nullish(),
  user: z.object({ id: z.union([z.string().min(1), z.int().positive()]) }).nullish(),
});

const marketSnapshot = z.object({ data: z.object({ sales: z.array(sale) }) });

export interface BiwengerMarketDependencies {
  fetchMarketListings: () => Promise<unknown>;
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
  manager.log('Syncing market listings');

  const db = manager.context.db;
  if (!db) throw new Error('Market sync requires a database connection.');

  const marketDate = resolveMarketDate();
  manager.log(`Fetching active market listings for market day ${marketDate}`);
  const response = marketSnapshot.safeParse(await deps.fetchMarketListings());
  if (!response.success) throw new Error('Invalid Biwenger market snapshot.');

  const listings = new Map<number, MarketListing>();
  for (const item of response.data.data.sales) {
    const id = typeof item.player === 'number' ? item.player : item.player.id;
    const amount = item.price ?? item.value;
    if (amount == null) throw new Error('Invalid Biwenger market snapshot: missing price.');
    listings.set(id, {
      player_id: id,
      price: amount,
      seller_id: item.user ? String(item.user.id) : null,
    });
  }

  const mutations = prepareMarketListingMutations(db, { seasonId: manager.context.seasonId });
  await mutations.replaceMarketSnapshot(marketDate, Array.from(listings.values()));
  manager.log(`Market listings synced: ${listings.size} upserted`);
  return {
    summary: 'Biwenger market snapshot synchronized.',
    counts: { listings: listings.size, skipped: 0 },
  };
}
