import { fetchLeague } from '../biwenger-client.js';

/**
 * Syncs league standings (users) to the local database.
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export async function syncStandings(db) {
  console.log('\n📥 Fetching Standings...');
  const league = await fetchLeague();
  const standings = league.data.standings;
  
  const insertUserStandings = db.prepare(`
    INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name)
  `);

  db.transaction(() => {
    for (const user of standings) {
      insertUserStandings.run({
        id: user.id.toString(),
        name: user.name
      });
    }
  })();
  console.log(`✅ Standings synced (${standings.length} users).`);
}
