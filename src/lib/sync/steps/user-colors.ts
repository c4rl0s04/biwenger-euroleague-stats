import type { SyncManager } from '../manager';
import { type UserColorsDependencies, syncUserColors } from '../services/biwenger/user-colors';

/**
 * Ensures every season user has a deterministic color_index between 0 and 12.
 * Delegates to the dedicated user-colors domain service.
 *
 * @param manager
 * @param dependencies Optional overrides for testing
 */
export async function run(manager: SyncManager, dependencies?: UserColorsDependencies) {
  return syncUserColors(manager, dependencies);
}
