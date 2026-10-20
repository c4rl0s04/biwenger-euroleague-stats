import { fetchRoundGames as defaultFetchRoundGames } from '../../../api/biwenger-client';
import {
  preparePlayerStatMutations,
  type PlayerStatMutations,
} from '../../../db/mutations/player-stats';
import type { DbClient } from '../../../db/mutations/matches';
import type { SyncManager } from '../../manager';
import type { BiwengerRound } from '../../rounds';

export interface FantasyPointsDependencies {
  fetchRoundGames?: (roundId: number) => Promise<unknown>;
  prepareMutations?: (db: DbClient, seasonId: string) => PlayerStatMutations;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Biwenger fantasy report structure.');
  }
  return value as Record<string, unknown>;
}

export function fantasyGames(payload: unknown): unknown[] {
  const envelope = object(payload);
  const games = object(envelope.data ?? envelope).games;
  if (!Array.isArray(games)) throw new Error('Biwenger returned no games for fantasy points.');
  return games;
}

export async function syncFantasyPoints(
  manager: SyncManager,
  round: BiwengerRound & { dbId: number },
  dependencies: FantasyPointsDependencies = {}
): Promise<{ reports: number; playerScores: number; missingScores: number }> {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  if (!manager.context.db) throw new Error('The sync database was not initialized.');
  const games = fantasyGames(
    await (dependencies.fetchRoundGames || defaultFetchRoundGames)(round.id)
  );
  const scores: Array<{ playerId: number; roundId: number; fantasyPoints: number }> = [];
  let reports = 0;
  let missingScores = 0;
  // Validate the complete response before persisting any scores from this round.
  for (const rawGame of games) {
    const game = object(rawGame);
    for (const side of [game.home, game.away]) {
      if (side == null) continue;
      const collection = object(side).reports;
      if (collection == null) continue;
      if (typeof collection !== 'object')
        throw new Error('Invalid Biwenger fantasy report collection.');
      for (const rawReport of Object.values(collection)) {
        reports++;
        const report = object(rawReport);
        const playerId = object(report.player).id;
        const points = report.points;
        if (
          typeof playerId !== 'number' ||
          !Number.isInteger(playerId) ||
          playerId <= 0 ||
          playerId > 2147483647 ||
          (points != null &&
            (typeof points !== 'number' ||
              !Number.isInteger(points) ||
              points < -2147483648 ||
              points > 2147483647))
        ) {
          throw new Error(`Invalid Biwenger fantasy report in round ${round.id}.`);
        }
        if (points == null) {
          missingScores++;
          continue;
        }
        scores.push({ playerId, roundId: round.dbId, fantasyPoints: points as number });
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
