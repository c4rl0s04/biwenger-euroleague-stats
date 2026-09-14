import type { SyncManager } from '../manager';
import {
  syncBiwengerBoard,
  defaultBoardDependencies,
  type BoardDependencies,
} from '../services/biwenger/board';

export async function run(
  manager: SyncManager,
  dependencies: BoardDependencies = defaultBoardDependencies
) {
  return syncBiwengerBoard(manager, dependencies);
}
