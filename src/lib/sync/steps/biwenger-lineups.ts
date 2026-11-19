import type { SyncManager } from '../manager';
import {
  getPlayerDirectoryMap,
  getRoundManagerResultCoverage,
  getRoundScheduleState,
} from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';
import { deriveRoundLifecycle } from '../../competition/public';
import * as lineups from '../services/biwenger/lineups';

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const rounds = relevantRounds((await manager.getBiwengerCompetition()).rounds);
  const players =
    manager.context.biwenger?.players || (await getPlayerDirectoryMap(manager.context.db));
  const finishedRounds: number[] = [];
  const counts = {
    rounds: 0,
    lineups: 0,
    fetchedManagers: 0,
    acceptedLineups: 0,
    persistedResults: 0,
    skippedSnapshots: 0,
    skippedRounds: 0,
    emptyRounds: 0,
    incompleteRounds: 0,
    missingResults: 0,
    failedRounds: 0,
  };
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
    const isFinal = effective === 'finished' && round.status === 'finished';
    if (isFinal) finishedRounds.push(dbId);
    const oldFinished =
      effective === 'finished' &&
      row.lastMatchDate &&
      now.getTime() - row.lastMatchDate.getTime() >= 86400000;
    if (
      effective === 'upcoming' ||
      (oldFinished && manager.mode !== 'bootstrap' && !manager.forceRound)
    ) {
      counts.skippedRounds++;
      const reason = effective === 'upcoming' ? 'upcoming' : 'outside_refresh_window';
      manager.log(`Lineup round ${dbId}: skipped (${reason}).`);
      continue;
    }
    manager.log(
      `Lineup round ${dbId}: ${effective}; provider status ${round.status || 'unknown'}.`
    );
    // Live snapshots are useful before manager results are final; never finalize them from schedule alone.
    try {
      const result = await lineups.run(
        manager,
        { ...round, status: isFinal ? 'finished' : 'active' },
        players
      );
      counts.rounds++;
      counts.lineups += result.insertedCount;
      counts.fetchedManagers += result.fetchedManagers;
      counts.acceptedLineups += result.acceptedLineups;
      counts.persistedResults += result.persistedResults;
      counts.skippedSnapshots += result.fetchedManagers - result.acceptedLineups;
      if (result.fetchedManagers === 0) {
        counts.emptyRounds++;
        manager.log(`Lineup round ${dbId}: provider returned empty standings.`);
      }
    } catch (error) {
      counts.failedRounds++;
      manager.log(
        `Lineup round ${dbId}: failed. Counts from completed rounds: ${JSON.stringify(counts)}`
      );
      throw error;
    }
  }

  const coverage = await getRoundManagerResultCoverage(
    seasonId,
    finishedRounds,
    manager.context.db
  );
  for (const { roundId, expected, missing } of coverage) {
    if (missing === 0) continue;
    counts.incompleteRounds++;
    counts.missingResults += missing;
    manager.warn(
      `Lineup round ${roundId}: incomplete final results (${missing}/${expected} managers missing).`
    );
  }

  return {
    summary: 'Biwenger lineups and manager round results synchronized.',
    counts,
  };
}
