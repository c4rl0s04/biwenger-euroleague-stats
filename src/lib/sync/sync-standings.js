import { fetchLeague } from '../api/biwenger-client.js';
import { prepareUserMutations } from '../db/mutations/users.js';

/**
 * Syncs league standings (users) to the local database.
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export async function syncStandings(db) {
  console.log('\n📥 Fetching Standings...');
  const league = await fetchLeague();
  const standings = league.data.standings;

  // Initialize Mutations
  const mutations = prepareUserMutations(db);

  db.transaction(() => {
    for (const user of standings) {
      mutations.upsertUser.run({
        id: user.id.toString(),
        name: user.name,
        icon: user.icon ? `https://cdn.biwenger.com/${user.icon}` : null,
      });
    }
  })();
  console.log(`✅ Standings synced (${standings.length} users).`);
}
