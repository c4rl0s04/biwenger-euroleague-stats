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
    INSERT INTO users (id, name, icon) VALUES (@id, @name, @icon)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon
  `);

  db.transaction(() => {
    for (const user of standings) {
      insertUserStandings.run({
        id: user.id.toString(),
        name: user.name,
        icon: user.icon ? `https://cdn.biwenger.com/${user.icon}` : null
      });
    }
  })();
  console.log(`✅ Standings synced (${standings.length} users).`);
}
