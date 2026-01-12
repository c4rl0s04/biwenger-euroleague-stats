import { fetchLeague } from '../../api/biwenger-client.js';
import { prepareUserMutations } from '../../db/mutations/users.js';

/**
 * Syncs league standings (users) to the local database.
 * @param {import('./manager').SyncManager} manager
 */
export async function run(manager) {
  const db = manager.context.db;
  manager.log('\n📥 Fetching Standings...');

  try {
    const league = await fetchLeague();
    const standings = league.data.standings;

    // Initialize Mutations
    const mutations = prepareUserMutations(db);

    for (const user of standings) {
      await mutations.upsertUser({
        id: user.id.toString(),
        name: user.name,
        icon: user.icon ? `https://cdn.biwenger.com/${user.icon}` : null,
      });
    }

    return {
      success: true,
      message: `Standings synced (${standings.length} users).`,
      data: standings,
    };
  } catch (err) {
    manager.error('❌ Error syncing standings:', err);
    return { success: false, message: 'Failed to sync standings', error: err };
  }
}

// Legacy export
export const syncStandings = async (db) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  const res = await run(mockManager);
  if (!res.success) throw res.error; // Legacy behavior threw errors
  return res.data;
};
