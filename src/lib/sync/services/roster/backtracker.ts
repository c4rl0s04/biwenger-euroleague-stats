import { CONFIG } from '../../../config';
import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface TransferHistoryItem {
  timestamp: number | string;
  player_id: number;
  vendedor: string;
  comprador: string;
}

export interface BacktrackerDependencies {
  prepareMutations?: (db: unknown, options: { seasonId: string }) => UserMutations;
  seasonStartDate?: string;
}

/**
 * Pure backtracking simulation.
 * Reconstructs initial squads (at time 0) by taking current squads and running transfer history in reverse:
 * - If user SOLD a player during the season: they owned the player before the sale -> ADD to squad.
 * - If user BOUGHT a player during the season: they didn't own the player before the purchase -> REMOVE from squad.
 */
export function simulateBacktracking(
  currentSquads: Map<string, Set<number>>,
  userNameToId: Map<string, string>,
  transfers: TransferHistoryItem[]
): Map<string, Set<number>> {
  // Deep copy squads so we don't mutate input
  const squads = new Map<string, Set<number>>();
  currentSquads.forEach((players, userId) => {
    squads.set(userId, new Set(players));
  });

  for (const tx of transfers) {
    const playerId = tx.player_id;
    const sellerName = String(tx.vendedor);
    const buyerName = String(tx.comprador);

    const sellerId = userNameToId.get(sellerName) || sellerName;
    const buyerId = userNameToId.get(buyerName) || buyerName;

    const isBuyerTracked = squads.has(buyerId);
    const isSellerTracked = squads.has(sellerId);

    if (isBuyerTracked) {
      const squad = squads.get(buyerId);
      if (squad && squad.has(playerId)) {
        squad.delete(playerId);
      }
    }

    if (isSellerTracked) {
      const squad = squads.get(sellerId);
      if (squad) {
        squad.add(playerId);
      }
    }
  }

  return squads;
}

/**
 * Derives and persists initial squads for the active season.
 */
export async function syncInitialSquads(
  manager: SyncManager,
  dependencies: BacktrackerDependencies = {}
) {
  manager.log('Inferring initial squads from ownership history');
  const seasonId = manager.context.seasonId;
  if (!seasonId) {
    throw new Error('Canonical sync season was not resolved before initial squads inference.');
  }

  const db = manager.context.db;
  const mutationsFactory = dependencies.prepareMutations || prepareUserMutations;
  const mutations = mutationsFactory(db as any, { seasonId });

  // 0. Clear existing initial squad data
  await mutations.clearInitialSquads();
  manager.log('Cleared previous initial squads data');

  // 1. Load season users and their current squads
  const usersRes = await mutations.getAllUsers();
  const users = usersRes.all();
  const currentSquads = new Map<string, Set<number>>();
  const userNameToId = new Map<string, string>();

  for (const user of users) {
    const currentParams = await mutations.getPlayersOwnedByUser(user.id);
    const currentIds = new Set<number>(currentParams.map((p: any) => p.player_id));
    currentSquads.set(String(user.id), currentIds);
    userNameToId.set(user.name, String(user.id));
  }
  manager.log(`Loaded current squads and name mappings for ${users.length} users`);

  // 2. Load complete transfer history (newest first)
  const transfers = (await mutations.getTransfersForBacktracking()) as TransferHistoryItem[];
  manager.log(`Processing ${transfers.length} transfers backwards`);

  // 3. Backtracking simulation
  const initialSquads = simulateBacktracking(currentSquads, userNameToId, transfers);

  // 4. Persist initial squad state
  const seasonStartDate = dependencies.seasonStartDate || CONFIG.LEAGUE.START_DATE || '';
  let totalInferred = 0;

  for (const user of users) {
    const initialSet = initialSquads.get(String(user.id));
    if (!initialSet) continue;
    manager.log(`User ${user.name}: start state has ${initialSet.size} players`);

    for (const playerId of Array.from(initialSet)) {
      const priceParams = await mutations.getInitialPrice(playerId, seasonStartDate);
      const price = priceParams ? priceParams.price : 0;

      try {
        await mutations.insertInitialSquad({
          user_id: user.id,
          player_id: playerId,
          price: price,
        });
        totalInferred++;
      } catch {
        // Ignore duplicate inserts gracefully
      }
    }
  }

  return {
    summary: 'Initial squads inferred from current ownership and transfer history.',
    counts: { users: users.length, players: totalInferred },
  };
}
