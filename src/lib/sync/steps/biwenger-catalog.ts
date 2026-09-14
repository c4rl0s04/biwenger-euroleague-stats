import type { SyncManager } from '../manager';
import {
  syncBiwengerCatalog,
  type BiwengerCatalogDependencies,
} from '../services/biwenger/catalog';

export async function run(manager: SyncManager, overrides?: Partial<BiwengerCatalogDependencies>) {
  return syncBiwengerCatalog(manager, overrides);
}
