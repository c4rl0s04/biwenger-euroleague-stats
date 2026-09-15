import { fetchRoundGames as defaultFetchRoundGames } from '../../../api/biwenger-client';
import {
  preparePlayerStatMutations,
  type PlayerStatMutations,
} from '../../../db/mutations/player-stats';
import type { SyncManager } from '../../manager';
import type { BiwengerRound } from '../../rounds';

export interface FantasyPointsDependencies {
  fetchRoundGames?: (roundId: number) => Promise<any>;
  prepareMutations?: (db: unknown, seasonId: string) => PlayerStatMutations;
}

export async function syncFantasyPoints(
  manager: SyncManager,
  round: BiwengerRound & { dbId: number },
  dependencies: FantasyPointsDependencies = {}
): Promise<number> {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');

  const fetchGames = dependencies.fetchRoundGames || defaultFetchRoundGames;
  const gamesData = await fetchGames(round.id);
  const games = gamesData?.data?.games || gamesData?.games;
  if (!Array.isArray(games)) {
    throw new Error(`Biwenger returned no games for round ${round.id}.`);
  }

  const mutationsFactory = dependencies.prepareMutations || preparePlayerStatMutations;
  const mutations = mutationsFactory(manager.context.db as any, seasonId);
  let updated = 0;
  for (const game of games) {
    for (const reports of [game.home?.reports, game.away?.reports]) {
      if (!reports) continue;
      for (const report of Object.values(reports) as any[]) {
        const playerId = report.player?.id;
        if (!playerId) continue;
        await mutations.updateFantasyPoints({
          playerId,
          roundId: round.dbId,
          fantasyPoints: report.points != null ? Number(report.points) : null,
        });
        updated++;
      }
    }
  }
  return updated;
}
