import type { SyncManager } from '../manager';
import { syncBiwengerMarket, type BiwengerMarketDependencies } from '../services/biwenger/market';

export async function run(manager: SyncManager, overrides?: Partial<BiwengerMarketDependencies>) {
  return syncBiwengerMarket(manager, overrides);
}
