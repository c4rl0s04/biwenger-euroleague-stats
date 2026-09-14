import type { SyncManager } from '../manager';
import { type UsersDependencies, syncBiwengerUsers } from '../services/biwenger/users';

/**
 * Syncs league standings (users) to the local database.
 * Delegates to the dedicated users domain service.
 *
 * @param manager
 * @param dependencies Optional overrides for testing
 */
export async function run(manager: SyncManager, dependencies?: UsersDependencies) {
  return syncBiwengerUsers(manager, dependencies);
}
