import { SyncManager } from '../manager';
import { syncOfficialMasterData } from '../services/official/master-data';

/**
 * Step 2: import official master data into season-scoped tables.
 * Global team/player fields are deliberately left untouched.
 */
export async function run(manager: SyncManager) {
  manager.log('\n🌍 Step 2: Syncing official master data...');
  const result = await syncOfficialMasterData(manager);
  return {
    success: true,
    message: `Imported ${result.schedule} official games; ${result.issues} mappings need review.`,
    data: result,
  };
}
