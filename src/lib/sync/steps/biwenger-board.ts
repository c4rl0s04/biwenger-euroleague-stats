import type { SyncManager } from '../manager';
import { syncBiwengerBoard, type BoardDependencies } from '../services/biwenger/board';

export async function run(manager: SyncManager, dependencies?: BoardDependencies) {
  return syncBiwengerBoard(manager, dependencies);
}
