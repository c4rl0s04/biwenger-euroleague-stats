import type { SyncManager } from '../manager';
import {
  type TournamentsDependencies,
  syncBiwengerTournaments,
} from '../services/biwenger/tournaments';

/**
 * Synchronizes Biwenger tournaments, phases, fixtures, and standings.
 * Delegates to the dedicated tournaments domain service.
 *
 * @param manager
 * @param dependencies Optional overrides for testing
 */
export async function run(manager: SyncManager, dependencies?: TournamentsDependencies) {
  return syncBiwengerTournaments(manager, dependencies);
}
