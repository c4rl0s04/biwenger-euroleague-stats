import { prepareUserMutations } from '../../db/mutations/users.js';
import { CONFIG } from '../../config.js';

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
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n🕰️  Step 9: Inferring Initial Squads (Backtracking)...');
  const db = manager.context.db;
  const mutations = prepareUserMutations(db);

  // 0. Clear existing data
  mutations.clearInitialSquads.run();
  manager.log('   🧹 Cleared previous initial squads data.');

  // 1. Load All Users and their CURRENT Squads
  // Step 8 must have run before this to populate `players.owner_id`
  const users = mutations.getAllUsers.all();
  const userSquads = new Map(); // UserId -> Set<PlayerId>
  const userNameToId = new Map(); // "All Stars" -> "13207868"

  for (const user of users) {
    const currentParams = mutations.getPlayersOwnedByUser.all(user.id);
    const currentIds = new Set(currentParams.map((p) => p.player_id));
    userSquads.set(String(user.id), currentIds);
    userNameToId.set(user.name, String(user.id));
  }
  manager.log(`   📊 Loaded current squads and name mappings for ${users.length} users.`);
  // manager.log(`   🔍 Tracking Users: ${Array.from(userSquads.keys()).join(', ')}`);

  // 2. Load Complete Transfer History (Newest First)
  // We only care about timestamp, player_id, seller, buyer
  // 2. Load Complete Transfer History (Newest First)
  // We only care about timestamp, player_id, seller, buyer
  const transfers = mutations.getTransfersForBacktracking.all();
  manager.log(`   📜 Processing ${transfers.length} transfers backwards...`);

  // 3. Backtracking Simulation
  // let logCount = 0;
  for (const tx of transfers) {
    const playerId = tx.player_id;
    // Resolve Names to IDs
    const sellerName = String(tx.vendedor);
    const buyerName = String(tx.comprador);

    const sellerId = userNameToId.get(sellerName) || sellerName; // Fallback to raw if not found
    const buyerId = userNameToId.get(buyerName) || buyerName;

    // Debug Log only for known users to avoid noise
    const isBuyerTracked = userSquads.has(buyerId);
    const isSellerTracked = userSquads.has(sellerId);

    if (isBuyerTracked) {
      const squad = userSquads.get(buyerId);
      if (squad.has(playerId)) {
        squad.delete(playerId);
        // manager.log(`      [undo-buy] User ${buyerId} bought P:${playerId}. Removing from initial squad. (Count: ${squad.size})`);
      }
    }

    if (isSellerTracked) {
      const squad = userSquads.get(sellerId);
      squad.add(playerId);
      // manager.log(`      [undo-sell] User ${sellerId} sold P:${playerId}. Adding back to initial squad. (Count: ${squad.size})`);
    }
  }

  // 4. Persist Final State (which is actually Initial State)
  const insertStmt = mutations.insertInitialSquad;
  const SEASON_START_DATE = CONFIG.LEAGUE.START_DATE;
  let totalInferred = 0;

  const insertInitial = db.transaction((user, squadSet) => {
    for (const playerId of squadSet) {
      // Get price at season start
      const priceParams = mutations.getInitialPrice.get(playerId, SEASON_START_DATE);
      const price = priceParams ? priceParams.price : 0;

      try {
        insertStmt.run({
          user_id: user.id,
          player_id: playerId,
          price: price,
        });
        totalInferred++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  });

  for (const user of users) {
    const initialSet = userSquads.get(String(user.id));
    manager.log(`      -> User ${user.name}: Start State has ${initialSet.size} players.`);
    insertInitial(user, initialSet);
  }

  return {
    success: true,
    message: `Inferred initial squads via backtracking. Inserted ${totalInferred} entries.`,
  };
}
