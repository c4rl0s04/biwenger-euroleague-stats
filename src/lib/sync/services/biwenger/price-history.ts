import { fetchPlayerDetails } from '../../../api/biwenger-client';
import type { SyncManager, SyncStepResult } from '../../manager';
import {
  parsePlayerPriceHistory,
  priceHistoryIsFresh,
  validatePriceHistoryBounds,
} from '../../price-history';
import {
  createPriceHistoryRepository,
  type PriceHistoryRepository,
} from '../../repositories/price-history';

export interface PriceHistoryDependencies {
  fetchHistory: (playerId: number) => Promise<unknown>;
  repository: PriceHistoryRepository;
  now: () => Date;
}

export async function syncBiwengerPriceHistory(
  manager: SyncManager,
  overrides: Partial<PriceHistoryDependencies> = {}
): Promise<SyncStepResult> {
  const { db, seasonId } = manager.context;
  if (!db || !seasonId)
    throw new Error('Price history requires a resolved sync database and season.');
  const deps: PriceHistoryDependencies = {
    fetchHistory: fetchPlayerDetails,
    repository: createPriceHistoryRepository(db),
    now: () => new Date(),
    ...overrides,
  };
  const now = deps.now();
  const today = now.toISOString().slice(0, 10);
  const { bounds, players } = await deps.repository.load(seasonId);
  validatePriceHistoryBounds(bounds);
  const due = players.filter(
    (player) =>
      manager.mode === 'bootstrap' ||
      !priceHistoryIsFresh(player.checkedAt, player.checkpointBounds, bounds, now)
  );
  if (manager.mode === 'bootstrap') {
    // A failed/interrupted forced refresh must stay due even if its old checkpoint was fresh.
    // Only this step's metadata is invalidated; all stored prices remain intact.
    await deps.repository.invalidateCheckpoints(
      seasonId,
      due.map((player) => player.playerId)
    );
  }
  const counts = {
    players: players.length,
    fetched: 0,
    skipped: players.length - due.length,
    inserted: 0,
    corrected: 0,
    unchanged: 0,
    empty: 0,
    failed: 0,
  };
  manager.log(`Reconciling price history for ${due.length}/${players.length} season players`);
  let next = 0;
  // Bounded reads retain the provider client's pacing and 429 backoff. Never open a DB
  // transaction while waiting for the network. Each player commits atomically and is resumable.
  await Promise.all(
    Array.from({ length: Math.min(2, due.length) }, async () => {
      while (next < due.length) {
        const player = due[next++];
        try {
          const response = await deps.fetchHistory(player.playerId);
          const prices = parsePlayerPriceHistory(response, player.playerId, bounds, today);
          const result = await deps.repository.reconcile(
            seasonId,
            player.playerId,
            prices,
            bounds,
            now.toISOString()
          );
          counts.fetched++;
          counts.inserted += result.inserted;
          counts.corrected += result.corrected;
          counts.unchanged += result.unchanged;
          if (!prices.length) counts.empty++;
        } catch {
          counts.failed++;
          // Do not expose provider payloads, credentials or SQL parameters in diagnostics.
          manager.warn(`Price history failed for player ${player.playerId}; retry remains due.`);
        }
        const completed = counts.fetched + counts.failed;
        if (completed % 25 === 0 || completed === due.length) {
          manager.log(`Price history progress: ${completed}/${due.length}`);
        }
      }
    })
  );
  manager.log(`Price history counts: ${JSON.stringify(counts)}`);
  if (counts.failed) {
    throw new Error(
      `Price history reconciliation failed for ${counts.failed} player(s); rerun the step.`
    );
  }
  return { summary: 'Available provider price history reconciled.', counts };
}
