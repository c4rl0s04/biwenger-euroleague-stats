import type { SyncManager } from '../manager';
import { type BacktrackerDependencies, syncInitialSquads } from '../services/roster/backtracker';

/**
 * Calculates the roster each user had at the start of the season using backtracking.
 * Delegates to the dedicated roster backtracker service.
 *
 * @param manager
 * @param dependencies Optional overrides for testing
 */
export async function run(manager: SyncManager, dependencies?: BacktrackerDependencies) {
  return syncInitialSquads(manager, dependencies);
}
