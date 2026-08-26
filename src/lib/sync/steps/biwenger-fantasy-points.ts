import type { SyncManager } from '../manager';
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
    const window = await (manager.context.db as any).query(
      `SELECT COUNT(*)::int AS count
       FROM matches
       WHERE season_id=$1 AND round_id=$2
         AND (date < NOW()+INTERVAL '1 hour' OR status IN ('live','finished'))`,
      [seasonId, dbId]
    );
    if (manager.mode === 'routine' && window.rows[0]?.count === 0) continue;
    points += await syncFantasyPoints(manager, { ...round, dbId });
    rounds++;
  }

  return {
    summary: 'Authoritative Biwenger fantasy points synchronized.',
    counts: { rounds, playerScores: points },
  };
}
