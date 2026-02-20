import { biwengerFetch } from '../../api/biwenger-client';
import { CONFIG } from '../../config';
import { prepareUserMutations } from '../../db/mutations/users';
import { SyncManager } from '../manager';

/**
 * Syncs current squads (ownership) for all users.
 * @param manager
 */
export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n📥 Syncing Squads (Ownership)...');

  // Initialize Mutations
  const mutations = prepareUserMutations(db as any);

  // 1. Reset all ownerships first
  await mutations.resetAllOwners();

  // 2. Get all users
  const usersRes = await mutations.getAllUsers();
  const users = usersRes.all(); // helper I added to users.js

  if (users.length === 0) {
    manager.log('No users found in DB. Skipping squad sync.');
    return { success: true, message: 'No users found in DB.' };
  }

  let totalPlayersOwned = 0;

  for (const user of users) {
    try {
      // Fetch user details with players field
      const response = await biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.USER_PLAYERS(user.id));
      const data = response.data;

      if (data && data.players) {
        const playerIds = data.players.map((p: any) => p.id);

        // Async Loop for updates
        for (const playerId of playerIds) {
          await mutations.updatePlayerOwner({
            owner_id: user.id,
            player_id: playerId,
          });
        }

        totalPlayersOwned += playerIds.length;
      }
    } catch (e: any) {
      manager.error(`   Error syncing squad for user ${user.name} (${user.id}):`, e.message);
    }
  }

  return { success: true, message: `Squads synced (${totalPlayersOwned} players assigned).` };
}

// Legacy export
export const syncSquads = async (db: any) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  return run(mockManager as any);
};
