import 'server-only';
export async function getRecentTransfers(limit = 5): Promise<RecentTransfer[]> {
  return (await readRecentTransfers(limit)).map(mapRecentTransfer);
}
export async function getSignificantPriceChanges(
  _hoursAgo = 24,
  minChange = 500000
): Promise<PriceChange[]> {
  return (await readSignificantPriceChanges(minChange)).map(mapPriceChange);
}
import type { RecentTransfer, PriceChange } from '../../models/market-activity-extra';
import {
  readRecentTransfers,
  readSignificantPriceChanges,
} from '../queries/market-activity-extra.query';
import { mapRecentTransfer, mapPriceChange } from '../mappers/market-activity-extra.mapper';
export const MARKET_ACTIVITY_EXTRA_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
