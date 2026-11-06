import type { SyncManager } from '../manager';
import { syncBiwengerSquads, type BiwengerSquadsDependencies } from '../services/biwenger/squads';

export async function run(manager: SyncManager, dependencies?: BiwengerSquadsDependencies) {
  return syncBiwengerSquads(manager, dependencies);
}
