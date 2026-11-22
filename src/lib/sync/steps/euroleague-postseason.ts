import type { SyncManager } from '../manager';
import { syncOfficialPostseason } from '../services/euroleague/postseason';

/** Stores official game phases and postseason scores for the playoff bracket. */
export async function run(manager: SyncManager) {
  manager.log('Syncing official EuroLeague phases and postseason scores');
  const counts = await syncOfficialPostseason(manager);
  return {
    summary: `Official schedule phases stored; ${counts.scored} postseason score(s) filled.`,
    counts,
  };
}
