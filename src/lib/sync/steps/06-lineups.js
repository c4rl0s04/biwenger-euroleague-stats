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

    // OPTIMIZATION: Daily Mode
    if (manager.context.isDaily) {
      const roundId = manager.resolveRoundId(round);
      try {
        const res = await manager.context.db.query(
          `SELECT 
                    MAX(date) as last_match_date, 
                    MIN(date) as first_match_date,
                    BOOL_AND(status = 'finished') as all_finished,
                    COUNT(*) as match_count
                 FROM matches 
                 WHERE round_id = $1`,
          [roundId]
        );

        const row = res.rows[0];
        if (row && row.match_count > 0) {
          const now = new Date();

          // 1. Skip if Completed
          if (row.all_finished) {
            continue;
          }

          // 2. Skip if Future
          if (row.first_match_date && new Date(row.first_match_date) > now) {
            continue;
          }
        }
      } catch (e) {
        // ignore error, sync anyway
      }
    }

    // Sync Lineups (Always)
    const lineupsRes = await syncLineups.run(manager, round, manager.context.playersList);
    totalLineups += lineupsRes.insertedCount || 0;
  }

  return { success: true, message: `Synced ${totalLineups} lineups.` };
}
