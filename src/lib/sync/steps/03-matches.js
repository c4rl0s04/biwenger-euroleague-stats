import * as syncMatches from '../services/biwenger/matches.js';

/**
 * Step 3: Sync Match Schedule
 * - Syncs Biwenger Schedule (Home vs Away, Scores, Status)
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n📅 Step 3: Syncing Match Schedule...');
  const competition = manager.context.competition;

  const rounds =
    competition?.data?.rounds ||
    competition?.data?.season?.rounds ||
    competition?.data?.data?.season?.rounds;

  if (!rounds) {
    throw new Error('Competition rounds data missing from Step 1');
  }

  for (const round of rounds) {
    const baseName = round.name;

    // Match Biwenger Round Names
    if (
      baseName.includes('Jornada') ||
      baseName.includes('Playoff') ||
      baseName.includes('Final Four')
    ) {
      // Valid Round
    } else {
      continue;
    }

    // OPTIMIZATION: In Daily Mode, skip rounds that finished long ago
    // OPTIMIZATION: In Daily Mode, skip rounds that finished long ago
    // OPTIMIZATION: In Daily Mode, skip rounds that finished long ago
    // Since the `round` object from Step 1 lacks dates, we query our own DB.
    if (manager.context.isDaily) {
      const roundId = manager.resolveRoundId(round);

      // Check local DB for this round's matches
      try {
        // Find schedule info for this round in DB
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

          // 1. Skip if Completed (All finished)
          if (row.all_finished) {
            continue;
          }

          // 2. Skip if Future (Not started yet)
          if (row.first_match_date && new Date(row.first_match_date) > now) {
            continue;
          }
        }
        // If no data in DB, or active, we sync.
      } catch (err) {
        manager.error(`   ⚠️ Failed to check DB optimization for round ${roundId}: ${err.message}`);
      }
    }

    manager.log(`\n🔹 Processing ${baseName}...`);

    // Sync Biwenger Schedule (Matches table)
    await syncMatches.run(manager, round, manager.context.playersList);
  }

  return {
    success: true,
    message: `Synced match schedule.`,
  };
}
