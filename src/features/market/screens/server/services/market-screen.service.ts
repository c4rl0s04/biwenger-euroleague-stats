import 'server-only';
import type { MobileMarketOverview } from '../../models/market-screen';
import { getCurrentMarketListings } from '../../../catalogue/server/services/market-catalogue.service';
import { getMarketKPIs } from '../../../trends/server/services/market-activity.service';
import { getRecentTransfers } from '../../../trends/server/services/market-activity-extra.service';

export const MARKET_SCREEN_POLICY = Object.freeze({
  access: 'public-fantasy-statistics-with-existing-app-layout-protection',
  identity: 'none',
  serverCache: 'none',
} as const);

/** Keep the original parallel reads, independent season resolutions and transfer limit. */
export async function getMobileMarketOverview(): Promise<MobileMarketOverview> {
  const [listings, kpis, recentTransfers] = await Promise.all([
    getCurrentMarketListings(),
    getMarketKPIs(),
    getRecentTransfers(4),
  ]);
  return { listings, kpis, recentTransfers };
}
