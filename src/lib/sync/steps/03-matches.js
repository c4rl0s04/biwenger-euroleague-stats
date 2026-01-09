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

    manager.log(`\n🔹 Processing ${baseName}...`);

    // Sync Biwenger Schedule (Matches table)
    await syncMatches.run(manager, round, manager.context.playersList);
  }

  return {
    success: true,
    message: `Synced match schedule.`,
  };
}
