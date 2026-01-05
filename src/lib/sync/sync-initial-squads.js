/**
 * Syncs initial squads by inferring ownership.
 * Logic: Initial Squad = (Players Sold by User + Players Currently Owned by User) - Players Bought by User
 * @param {import('./manager').SyncManager} manager
 */
import { CONFIG } from '../config.js';
import { prepareUserMutations } from '../db/mutations/users.js';

// League start date - when users joined and drafted their initial squads
const LEAGUE_START_DATE = CONFIG.LEAGUE.START_DATE;

export async function run(manager) {
  const db = manager.context.db;
  manager.log('\n📥 Syncing Initial Squads (Inferred)...');
  manager.log(`   📅 Using league start date: ${LEAGUE_START_DATE}`);

  // Initialize Mutations
  const mutations = prepareUserMutations(db);

  // 1. Get all users
  const users = mutations.getAllUsers.all();
  if (users.length === 0) {
    manager.log('No users found. Skipping.');
    return { success: true, message: 'No users found.' };
  }

  let totalInferred = 0;

  for (const user of users) {
    // A. Get all players EVER sold by this user
    // If you sold it, you must have owned it.
    const soldPlayers = mutations.getPlayersSoldByUser
      .all(user.name, user.id)
      .map((r) => r.player_id);

    // B. Get players CURRENTLY owned by this user
    // If you own it now, you might have started with it.
    const currentPlayers = mutations.getPlayersOwnedByUser.all(user.id).map((r) => r.player_id);

    // Union of Sold + Current = All players ever interacting with this user as "Owner"
    const allOwned = new Set([...soldPlayers, ...currentPlayers]);

    // C. Get all players EVER bought by this user
    // If you bought it, it wasn't initial (unless you sold it and re-bought it, handled below)
    // Note: We need to be careful about re-buys.
    // Refined Logic:
    // A player is "Initial" if the *first* time it appears in your history, you are the Seller (or Current Owner w/ no history).
    // Let's look at the earliest event for each player for this user.

    const inferredInitial = [];

    for (const playerId of allOwned) {
      // Get chronological events for this player involving this user
      // Events: 'buy' (user is buyer), 'sell' (user is seller)
      // We order by timestamp ASC.

      // Fichajes involving user as Buyer
      const buys = mutations.getPurchasesByPlayerAndUser.all(playerId, user.name, user.id);

      // Fichajes involving user as Seller
      const sells = mutations.getSalesByPlayerAndUser.all(playerId, user.name, user.id);

      // Combine and Sort by time
      const events = [...buys, ...sells].sort((a, b) => a.timestamp - b.timestamp);

      if (events.length === 0) {
        // No transfer history, but currently owned (from 'currentPlayers').
        // Must be initial.
        inferredInitial.push(playerId);
      } else {
        // Has history. Look at the FIRST event.
        const firstEvent = events[0];

        if (firstEvent.type === 'sell') {
          // First thing you did was SELL it -> You started with it.
          inferredInitial.push(playerId);
        }
        // If first event is 'buy', you bought it -> Not initial.
      }
    }

    // Insert inferred players with their initial price
    const transaction = db.transaction(() => {
      for (const pid of inferredInitial) {
        // Look up price on league start date
        const priceRow = mutations.getInitialPrice.get(pid, LEAGUE_START_DATE);
        const initialPrice = priceRow ? priceRow.price : null;

        mutations.insertInitialSquad.run({
          user_id: user.id,
          player_id: pid,
          price: initialPrice,
        });
      }
    });
    transaction();

    totalInferred += inferredInitial.length;
    // console.log(`   -> User ${user.name}: Inferred ${inferredInitial.length} initial players.`);
  }

  // manager.log(`✅ Initial Squads synced (${totalInferred} assignments).`);
  return { success: true, message: `Initial Squads synced (${totalInferred} assignments).` };
}

// Legacy export
export const syncInitialSquads = async (db) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  return run(mockManager);
};
