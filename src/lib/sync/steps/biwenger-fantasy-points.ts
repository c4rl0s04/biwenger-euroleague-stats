import type { SyncManager } from '../manager';
import { hasActiveMatchesInWindow } from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';
import { syncFantasyPoints } from '../services/biwenger/fantasy-points';

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const snapshot = await manager.getBiwengerCompetition();
  let points = 0;
  let rounds = 0;

  for (const round of relevantRounds(snapshot.rounds)) {
    const dbId = manager.resolveRoundId(round);
    if (manager.mode === 'routine') {
      const hasActive = await hasActiveMatchesInWindow(seasonId, dbId, manager.context.db);
      if (!hasActive) continue;
    }
    points += await syncFantasyPoints(manager, { ...round, dbId });
    rounds++;
  }

  return {
    summary: 'Authoritative Biwenger fantasy points synchronized.',
    counts: { rounds, playerScores: points },
  };
}
