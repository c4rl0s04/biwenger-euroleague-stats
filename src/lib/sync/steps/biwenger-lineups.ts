import type { SyncManager } from '../manager';
import {
  getLiveRounds,
  getPlayerDirectoryMap,
  getRoundScheduleState,
} from '../repositories/sync-queries';
import { relevantRounds } from '../rounds';
import * as lineups from '../services/biwenger/lineups';

async function playerMap(manager: SyncManager): Promise<Record<string, any>> {
  if (manager.context.biwenger) return manager.context.biwenger.players;
  return getPlayerDirectoryMap(manager.context.db);
}

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');

  const rounds =
    manager.mode === 'live'
      ? await getLiveRounds(seasonId, manager.context.db)
      : relevantRounds((await manager.getBiwengerCompetition()).rounds);
  const players = await playerMap(manager);
  let inserted = 0;
  let synchronizedRounds = 0;

  for (const round of rounds) {
    const roundId = manager.resolveRoundId(round);
    const row = await getRoundScheduleState(seasonId, roundId, true, manager.context.db);
    const now = new Date();

    if (manager.mode === 'live' && row.hasLineups) continue;
    if (manager.mode === 'routine' && row.matchCount > 0) {
      const lastMatch = row.lastMatchDate ? row.lastMatchDate.getTime() : 0;
      if (row.allFinished && now.getTime() - lastMatch >= 24 * 60 * 60 * 1000) continue;
      if (row.firstMatchDate && row.firstMatchDate > now) continue;
    }

    const result = await lineups.run(manager, { ...round, id: roundId }, players);
    inserted += result.insertedCount || 0;
    synchronizedRounds++;
  }

  return {
    summary: 'Biwenger lineups and manager round results synchronized.',
    counts: { rounds: synchronizedRounds, lineups: inserted },
  };
}
