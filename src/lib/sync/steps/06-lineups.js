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

  let rounds =
    competition?.data?.rounds ||
    competition?.data?.season?.rounds ||
    competition?.data?.data?.season?.rounds;

  // If missing (standalone run), fetch it
  if (!rounds) {
    manager.log('   ⚠️ Competition context missing. Fetching from API...');

    // Dynamic import to avoid circular dep issues or just standard if available.
    // Assuming fetchCompetition is in biwenger-client which is usually imported.
    const { fetchCompetition } = await import('../../api/biwenger-client.js');
    const compData = await fetchCompetition();

    rounds =
      compData?.data?.rounds ||
      compData?.data?.season?.rounds ||
      compData?.data?.data?.season?.rounds ||
      compData?.rounds;

    if (!rounds) throw new Error('Could not fetch competition rounds data.');
  }

  // 2. Ensure Players List is populated (for isolation run)
  if (!manager.context.playersList || Object.keys(manager.context.playersList).length === 0) {
    manager.log('   ⚠️ Players list missing. Fetching from DB...');
    const res = await db.query('SELECT id, name FROM players');
    manager.context.playersList = res.rows.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
    manager.log(`   Fetched ${res.rows.length} players from DB.`);
  }

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

          // 1. Skip if Completed AND Old
          const lastMatchTime = row.last_match_date ? new Date(row.last_match_date).getTime() : 0;
          const isRecent = now.getTime() - lastMatchTime < 24 * 60 * 60 * 1000;

          if (row.all_finished && !isRecent) {
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
