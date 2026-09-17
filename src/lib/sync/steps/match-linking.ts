import * as syncMatches from '../services/biwenger/matches';
import { SyncManager } from '../manager';
import { getRoundScheduleState } from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';

/** Links Biwenger round/team identities to the authoritative official calendar. */
export async function run(manager: SyncManager) {
  manager.log('Linking fantasy matches to official calendar');
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
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
        const row = await getRoundScheduleState(seasonId, roundId, false, manager.context.db);
        if (row && row.matchCount > 0) {
          const now = new Date();
          const lastMatchTime = row.lastMatchDate ? row.lastMatchDate.getTime() : 0;
          const isRecent = now.getTime() - lastMatchTime < 24 * 60 * 60 * 1000;

          if (row.allFinished && !isRecent) {
            continue;
          }
        }
      } catch (err: any) {
        manager.log(`Could not optimize round ${roundId}: ${err.message}`);
      }
    }

    manager.log(`Linking ${roundToSync.name}`);

    const result = await syncMatches.run(manager, roundToSync, snapshot.players);
    linkedMatches += result.synced;
    processedRounds++;
  }

  return {
    summary: 'Biwenger rounds linked to the official calendar.',
    counts: { rounds: processedRounds, matches: linkedMatches },
  };
}
