import { prepareUserMutations } from '../../db/mutations/users';
import { CONFIG } from '../../config';
import { SyncManager } from '../manager';

/**
 * Step 9: Infer Initial Squads
 * Calculates the roster each user had at the start of the season using Backtracking.
 * Algorithm:
 * 1. Start with CURRENT SQUAD provided by Step 8.
 * 2. Load complete transfer history (`fichajes`) sorted by DATE DESC (Newest -> Oldest).
 * 3. Simulate backwards:
 *    - Process "Sell" (User SOLD to someone): It means User HAD this player before this moment. -> ADD to squad.
 *    - Process "Buy" (User BOUGHT from someone): It means User DID NOT HAVE this player before this moment. -> REMOVE from squad.
 * 4. Result is the State at Time 0.
 *
 * @param manager
 */
export async function run(manager: SyncManager) {
  manager.log('\n🕰️  Step 9: Inferring Initial Squads (Backtracking)...');
  const db = manager.context.db;
  const mutations = prepareUserMutations(db as any);

  // 0. Clear existing data
  await mutations.clearInitialSquads();
  manager.log('   🧹 Cleared previous initial squads data.');

  // 1. Load All Users and their CURRENT Squads
  // Step 8 must have run before this to populate `players.owner_id`
  const usersRes = await mutations.getAllUsers();
  const users = usersRes.all();
  const userSquads = new Map<string, Set<number>>(); // UserId -> Set<PlayerId>
  const userNameToId = new Map<string, string>(); // "All Stars" -> "13207868"

  for (const user of users) {
    const currentParams = await mutations.getPlayersOwnedByUser(user.id);
    const currentIds = new Set(currentParams.map((p: any) => p.player_id));
    userSquads.set(String(user.id), currentIds as any);
    userNameToId.set(user.name, String(user.id));
  }
  manager.log(`   📊 Loaded current squads and name mappings for ${users.length} users.`);

  // 2. Load Complete Transfer History (Newest First)
  const transfers = await mutations.getTransfersForBacktracking();
  manager.log(`   📜 Processing ${transfers.length} transfers backwards...`);

  // 3. Backtracking Simulation
  for (const tx of transfers) {
    const playerId = tx.player_id;
    // Resolve Names to IDs
    const sellerName = String(tx.vendedor);
    const buyerName = String(tx.comprador);

    const sellerId = userNameToId.get(sellerName) || sellerName; // Fallback to raw if not found
    const buyerId = userNameToId.get(buyerName) || buyerName;

    const isBuyerTracked = userSquads.has(buyerId);
    const isSellerTracked = userSquads.has(sellerId);

    if (isBuyerTracked) {
      const squad = userSquads.get(buyerId);
      if (squad && squad.has(playerId)) {
        squad.delete(playerId);
      }
    }

    if (isSellerTracked) {
      const squad = userSquads.get(sellerId);
      if (squad) squad.add(playerId);
    }
  }

  // 4. Persist Final State (which is actually Initial State)
  const SEASON_START_DATE = CONFIG.LEAGUE.START_DATE;
  let totalInferred = 0;

  for (const user of users) {
    const initialSet = userSquads.get(String(user.id));
    if (!initialSet) continue;
    manager.log(`      -> User ${user.name}: Start State has ${initialSet.size} players.`);

    // Async Insert Loop
    for (const playerId of Array.from(initialSet)) {
      // Get price at season start
      const priceParams = await mutations.getInitialPrice(playerId, SEASON_START_DATE || '');
      const price = priceParams ? priceParams.price : 0;

      try {
        await mutations.insertInitialSquad({
          user_id: user.id,
          player_id: playerId,
          price: price,
        });
        totalInferred++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  return {
    success: true,
    message: `Inferred initial squads via backtracking. Inserted ${totalInferred} entries.`,
  };
}
