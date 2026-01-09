import * as syncLineups from '../services/biwenger/lineups.js';

/**
 * Step 6: Sync User Lineups
 * - Syncs Lineups for each completed round
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n👥 Step 6: Syncing User Lineups...');
  const db = manager.context.db;
  const competition = manager.context.competition;

  const rounds =
    competition?.data?.rounds ||
    competition?.data?.season?.rounds ||
    competition?.data?.data?.season?.rounds;
  if (!rounds) throw new Error('Competition rounds data missing.');

  // Optimization removed: Always sync all lineups

  let totalLineups = 0;

  for (const round of rounds) {
    const baseName = round.name;

    // Filter Rounds
    if (
      !baseName.includes('Jornada') &&
      !baseName.includes('Playoff') &&
      !baseName.includes('Final Four')
    )
      continue;

    // Sync Lineups (Always)
    const lineupsRes = await syncLineups.run(manager, round, manager.context.playersList);
    totalLineups += lineupsRes.insertedCount || 0;
  }

  return { success: true, message: `Synced ${totalLineups} lineups.` };
}
