import type { SyncManager } from '../manager';
import {
  syncBiwengerSquads,
  defaultSquadsDependencies,
  type BiwengerSquadsDependencies,
} from '../services/biwenger/squads';

export async function run(
  manager: SyncManager,
  dependencies: BiwengerSquadsDependencies = defaultSquadsDependencies
) {
  return syncBiwengerSquads(manager, dependencies);
}
