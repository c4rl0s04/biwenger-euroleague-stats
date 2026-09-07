import 'server-only';

import { cached, CACHE_TTL } from '@/lib/utils/cache';
import type { AllPlayAllEntry } from '../../models/all-play-all';
import { createAllPlayAllCalculation } from '../all-play-all-calculation';
import { mapAllPlayAllEntry } from '../mappers/all-play-all.mapper';
import {
  resolveAllPlayAllSeason,
  listAllPlayAllRounds,
  listAllPlayAllUsers,
  listAllPlayAllScores,
} from '../queries/all-play-all.query';
import type {
  AllPlayAllComputedRecord,
  AllPlayAllRoundRecord,
  AllPlayAllScoreRecord,
  AllPlayAllUserRecord,
} from '../queries/all-play-all.records';

export const ALL_PLAY_ALL_POLICY = Object.freeze({
  access: 'public-league-statistics',
  identity: 'none',
  cachePrefix: 'advanced:all-play-all:',
  ttlSeconds: CACHE_TTL.LONG,
  httpCacheHeader: 'unchanged-unset',
} as const);
export interface AllPlayAllDependencies {
  resolveSeason(): Promise<string>;
  rounds(seasonId: string): Promise<AllPlayAllRoundRecord[]>;
  users(seasonId: string): Promise<AllPlayAllUserRecord[]>;
  scores(roundId: number | null, seasonId: string): Promise<AllPlayAllScoreRecord[]>;
  cache(
    key: string,
    ttl: number,
    load: () => Promise<AllPlayAllComputedRecord[]>
  ): Promise<AllPlayAllComputedRecord[]>;
}

export function createAllPlayAllService(dependencies: AllPlayAllDependencies) {
  return async function fetchAllPlayAllStats(): Promise<AllPlayAllEntry[]> {
    // Keep season failures outside the caught/cacheable query failure boundary.
    const seasonId = await dependencies.resolveSeason();
    const rows = await dependencies.cache(
      `${ALL_PLAY_ALL_POLICY.cachePrefix}${seasonId}`,
      ALL_PLAY_ALL_POLICY.ttlSeconds,
      async () => {
        try {
          const rounds = await dependencies.rounds(seasonId);
          const users = await dependencies.users(seasonId);
          const calculation = createAllPlayAllCalculation(users);
          for (const round of rounds) {
            calculation.addRound(await dependencies.scores(round.round_id, seasonId));
          }
          return calculation.finish();
        } catch (error) {
          console.error('Error in getAllPlayAllStats:', error);
          return [];
        }
      }
    );
    return rows.map(mapAllPlayAllEntry);
  };
}

export const fetchAllPlayAllStats = createAllPlayAllService({
  resolveSeason: resolveAllPlayAllSeason,
  rounds: listAllPlayAllRounds,
  users: listAllPlayAllUsers,
  scores: listAllPlayAllScores,
  cache: cached,
});
