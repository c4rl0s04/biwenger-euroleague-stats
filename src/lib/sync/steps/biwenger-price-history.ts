import type { SyncManager } from '../manager';
import {
  syncBiwengerPriceHistory,
  type PriceHistoryDependencies,
} from '../services/biwenger/price-history';

export function run(manager: SyncManager, overrides?: Partial<PriceHistoryDependencies>) {
  return syncBiwengerPriceHistory(manager, overrides);
}
