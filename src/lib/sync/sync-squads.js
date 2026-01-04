import { biwengerFetch, fetchLeague } from '../api/biwenger-client.js';
import { CONFIG } from '../config.js';
import { prepareUserMutations } from '../db/mutations/users.js';

/**
 * Syncs current squads (ownership) for all users.
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export async function syncSquads(db) {
  console.log('\n📥 Syncing Squads (Ownership)...');

  // Initialize Mutations
  const mutations = prepareUserMutations(db);

  // 1. Reset all ownerships first (in case players were sold to market)
  mutations.resetAllOwners.run();

  // 2. Get all users from DB (or fetch league if DB is empty, but syncStandings runs first)
  const users = mutations.getAllUsers.all();

  if (users.length === 0) {
    console.log('No users found in DB. Skipping squad sync.');
    return;
  }

  let totalPlayersOwned = 0;

  for (const user of users) {
    try {
      // Fetch user details with players field
      // Note: This endpoint might be rate-limited if many users, but usually fine for small leagues
      const response = await biwengerFetch(CONFIG.ENDPOINTS.USER_PLAYERS(user.id));
      const data = response.data;

      if (data && data.players) {
        const playerIds = data.players.map((p) => p.id);

        const updateTransaction = db.transaction(() => {
          for (const playerId of playerIds) {
            mutations.updatePlayerOwner.run({
              owner_id: user.id,
              player_id: playerId,
            });
          }
        });

        updateTransaction();
        totalPlayersOwned += playerIds.length;
        // console.log(`   -> Updated ${playerIds.length} players for ${user.name}`);
      }
    } catch (e) {
      console.error(`   Error syncing squad for user ${user.name} (${user.id}):`, e.message);
    }
  }

  console.log(`✅ Squads synced (${totalPlayersOwned} players assigned).`);
}
