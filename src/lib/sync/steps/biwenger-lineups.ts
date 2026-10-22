import type { SyncManager } from '../manager';
import { getPlayerDirectoryMap, getRoundScheduleState } from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';
import { deriveRoundLifecycle } from '../../competition/public';
import * as lineups from '../services/biwenger/lineups';

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const rounds = relevantRounds((await manager.getBiwengerCompetition()).rounds);
  const players =
    manager.context.biwenger?.players || (await getPlayerDirectoryMap(manager.context.db));
  let inserted = 0;
  let synchronizedRounds = 0;
  const now = new Date();
  if (
    manager.forceRound &&
    !rounds.some((round) => manager.resolveRoundId(round) === manager.forceRound)
  )
    throw new Error('Requested canonical round is not in the provider calendar.');
  for (const round of rounds) {
    const dbId = manager.resolveRoundId(round);
    if (manager.forceRound && dbId !== manager.forceRound) continue;
    const row = await getRoundScheduleState(seasonId, dbId, false, manager.context.db);
    const lifecycle = deriveRoundLifecycle(
      {
        firstMatchDate: row.firstMatchDate,
        matchCount: row.matchCount,
        finishedMatches: row.allFinished ? row.matchCount : row.finishedMatches || 0,
        hasLiveMatch: row.hasLiveMatch,
      },
      now
    );
    const effective = row.matchCount
      ? lifecycle
      : round.status === 'finished'
        ? 'finished'
        : round.status === 'active'
          ? 'live'
          : 'upcoming';
    const oldFinished =
      effective === 'finished' &&
      row.lastMatchDate &&
      now.getTime() - row.lastMatchDate.getTime() >= 86400000;
    if (
      effective === 'upcoming' ||
      (oldFinished && manager.mode !== 'bootstrap' && !manager.forceRound)
    ) {
      manager.log(`Lineup round ${dbId}: skipped (${effective}).`);
      continue;
    }
    manager.log(
      `Lineup round ${dbId}: ${effective}; provider status ${round.status || 'unknown'}.`
    );
    // Live snapshots are useful before manager results are final; never finalize them from schedule alone.
    const result = await lineups.run(
      manager,
      {
        ...round,
        status: effective === 'finished' && round.status === 'finished' ? 'finished' : 'active',
      },
      players
    );
    inserted += result.insertedCount || 0;
    synchronizedRounds++;
  }
  return {
    summary: 'Biwenger lineups and manager round results synchronized.',
    counts: { rounds: synchronizedRounds, lineups: inserted },
  };
}
