import * as syncMatches from '../services/biwenger/matches';
import { SyncManager } from '../manager';
import { relevantRounds } from '../rounds';

/** Links Biwenger round/team identities to the authoritative official calendar. */
export async function run(manager: SyncManager) {
  manager.log('\n📅 Linking fantasy matches to the official calendar...');
  const seasonId = manager.context.seasonId;
  const snapshot = await manager.getBiwengerCompetition();
  const rounds = relevantRounds(snapshot.rounds);
  let processedRounds = 0;
  let linkedMatches = 0;
  for (const roundToSync of rounds) {
    // Routine runs skip completed rounds once their last match is no longer recent.
    if (manager.mode === 'routine') {
      const roundId = manager.resolveRoundId(roundToSync);

      // Check local DB for this round's matches
      try {
        // Find schedule info for this round in DB
        const res = await (manager.context.db as any).query(
          `SELECT 
                    MAX(date) as last_match_date, 
                    MIN(date) as first_match_date,
                    BOOL_AND(status = 'finished') as all_finished,
                    COUNT(*) as match_count
                 FROM matches 
                 WHERE season_id = $2 AND round_id = $1`,
          [roundId, seasonId]
        );

        const row = res.rows[0];
        if (row && row.match_count > 0) {
          const now = new Date();

          const lastMatchTime = row.last_match_date ? new Date(row.last_match_date).getTime() : 0;
          const isRecent = now.getTime() - lastMatchTime < 24 * 60 * 60 * 1000;

          if (row.all_finished && !isRecent) {
            continue;
          }
        }
      } catch (err: any) {
        manager.log(`   ⚠️ Could not optimize round ${roundId}: ${err.message}`);
      }
    }

    manager.log(`\n🔹 Linking ${roundToSync.name}...`);

    const result = await syncMatches.run(manager, roundToSync, snapshot.players);
    linkedMatches += result.synced;
    processedRounds++;
  }

  return {
    summary: 'Biwenger rounds linked to the official calendar.',
    counts: { rounds: processedRounds, matches: linkedMatches },
  };
}
