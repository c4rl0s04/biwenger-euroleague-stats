import { readBiwengerRoundGames } from '@/features/provider/server';
import {
  preparePlayerStatMutations,
  type PlayerStatMutations,
} from '../../../db/mutations/player-stats';
import type { DbClient } from '../../../db/mutations/matches';
import type { SyncManager } from '../../manager';
import type { BiwengerRound } from '../../rounds';

export interface FantasyPointsDependencies {
  fetchRoundGames?: typeof readBiwengerRoundGames;
  prepareMutations?: (db: DbClient, seasonId: string) => PlayerStatMutations;
}

export async function syncFantasyPoints(
  manager: SyncManager,
  round: BiwengerRound & { dbId: number },
  dependencies: FantasyPointsDependencies = {}
): Promise<{ reports: number; playerScores: number; missingScores: number }> {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  if (!manager.context.db) throw new Error('The sync database was not initialized.');
  const games = await (dependencies.fetchRoundGames || readBiwengerRoundGames)(round.id);
  const scores: Array<{ playerId: number; roundId: number; fantasyPoints: number }> = [];
  let reports = 0;
  let missingScores = 0;
  for (const game of games) {
    for (const side of [game.home, game.away]) {
      for (const { player, points } of Object.values(side?.reports ?? {})) {
        reports++;
        if (points == null) {
          missingScores++;
          continue;
        }
        scores.push({ playerId: player.id, roundId: round.dbId, fantasyPoints: points });
      }
    }
  }
  const mutations = (dependencies.prepareMutations || preparePlayerStatMutations)(
    manager.context.db,
    seasonId
  );
  for (const score of scores) await mutations.updateFantasyPoints(score);
  return { reports, playerScores: scores.length, missingScores };
}
