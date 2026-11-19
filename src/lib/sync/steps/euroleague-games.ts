import { prepareOfficialGameMutations } from '../../db/mutations/official/game-data';
import type { SyncManager } from '../manager';
import * as officialStats from '../services/euroleague/games';

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>
) {
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      await worker(values[next++]);
    }
  });
  // Let in-flight games finish while the manager still owns the advisory lock.
  const results = await Promise.allSettled(runners);
  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected) throw rejected.reason;
}

export async function run(manager: SyncManager) {
  manager.log('Synchronizing official EuroLeague game data');
  const db = manager.context.db as any;
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const forceGame = manager.forceGame;

  const mutations = prepareOfficialGameMutations(db, seasonId);
  const candidates = await mutations.getSyncCandidates(forceGame);
  const counts = { updated: 0, unchanged: 0, unavailable: 0, failed: 0 };
  let firstFailure: unknown;
  await mapWithConcurrency(candidates, 2, async (game) => {
    try {
      const result = await officialStats.runGame(
        manager,
        game.game_code,
        game.round_id,
        game.round_name,
        {
          force: forceGame === game.game_code,
          existingChecksum: game.payload_checksum,
        }
      );
      if (result.status === 'updated') counts.updated++;
      if (result.status === 'unchanged') counts.unchanged++;
      if (result.status === 'not_available_yet') counts.unavailable++;
    } catch (error) {
      if (counts.failed === 0) firstFailure = error;
      counts.failed++;
      manager.warn(`Official game ${game.game_code} failed.`);
    }
  });

  const metrics = manager.context.euroleague.getMetrics();
  const lastSuccessfulAgeSeconds = metrics.lastSuccessfulAt
    ? Math.round((Date.now() - Date.parse(metrics.lastSuccessfulAt)) / 1000)
    : null;
  manager.log(
    `Official provider metrics: ${JSON.stringify({ ...metrics, lastSuccessfulAgeSeconds })}`
  );

  if (counts.failed) {
    manager.log(
      `Official game counts: ${JSON.stringify({ candidates: candidates.length, ...counts })}`
    );
    throw new Error(`Official game synchronization failed for ${counts.failed} game(s).`, {
      cause: firstFailure,
    });
  }

  return {
    summary: 'Official reports, scores, boxscores, events and shots synchronized.',
    counts: { candidates: candidates.length, ...counts },
  };
}
