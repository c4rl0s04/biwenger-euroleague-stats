import type { SyncManager } from '../manager';
import { getFantasyPointLiveRounds, hasActiveMatchesInWindow } from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';
import { syncFantasyPoints } from '../services/biwenger/fantasy-points';
import { readBiwengerRoundGames } from '@/features/provider/server';
import { validateBiwengerRoundSeason } from '../preflight';

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const snapshot = await manager.getBiwengerCompetition();
  const rounds = relevantRounds(snapshot.rounds);
  const liveIds =
    manager.mode === 'live'
      ? new Set(
          (await getFantasyPointLiveRounds(seasonId, manager.context.db)).map((round) => round.id)
        )
      : null;
  const selected = [];
  for (const round of rounds) {
    const dbId = manager.resolveRoundId(round);
    const eligible = liveIds
      ? liveIds.has(dbId)
      : round.status === 'active' ||
        round.status === 'finished' ||
        (await hasActiveMatchesInWindow(seasonId, dbId, manager.context.db));
    if (eligible) selected.push({ ...round, dbId });
  }
  const counts = {
    selectedRounds: selected.length,
    rounds: 0,
    reports: 0,
    playerScores: 0,
    missingScores: 0,
  };
  if (selected.length) {
    // Single-step recovery and live runs do not execute the catalogue's season-readiness guard.
    const firstRound = rounds[0];
    const games = await readBiwengerRoundGames(firstRound.id);
    validateBiwengerRoundSeason({
      seasonId,
      games,
    });
    for (const round of selected) {
      const result = await syncFantasyPoints(manager, round, {
        fetchRoundGames: (id) =>
          id === firstRound.id ? Promise.resolve(games) : readBiwengerRoundGames(id),
      });
      counts.rounds++;
      counts.reports += result.reports;
      counts.playerScores += result.playerScores;
      counts.missingScores += result.missingScores;
      if (round.status === 'finished' && result.playerScores === 0) {
        manager.warn(`Completed round ${round.id} returned no usable fantasy scores.`);
      }
    }
  }
  if (
    manager.mode !== 'live' &&
    !selected.length &&
    rounds.some((round) => round.status === 'finished')
  ) {
    manager.warn('No fantasy rounds selected despite completed competition rounds.');
  }
  return { summary: 'Biwenger fantasy-point refresh completed.', counts };
}
