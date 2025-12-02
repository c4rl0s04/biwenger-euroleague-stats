import { biwengerFetch, fetchLeague } from '../biwenger-client.js';

/**
 * Syncs current squads (ownership) for all users.
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export async function syncSquads(db) {
  console.log('\n📥 Syncing Squads (Ownership)...');
  
  // 1. Reset all ownerships first (in case players were sold to market)
  db.prepare('UPDATE players SET owner_id = NULL').run();

  // 2. Get all users from DB (or fetch league if DB is empty, but syncStandings runs first)
  const users = db.prepare('SELECT id, name FROM users').all();
  
  if (users.length === 0) {
      console.log('No users found in DB. Skipping squad sync.');
      return;
  }

  const updateOwner = db.prepare('UPDATE players SET owner_id = @owner_id WHERE id = @player_id');
  
  let totalPlayersOwned = 0;

  for (const user of users) {
      try {
          // Fetch user details with players field
          // Note: This endpoint might be rate-limited if many users, but usually fine for small leagues
          const response = await biwengerFetch(`/user/${user.id}?fields=players`);
          const data = response.data;
          
          if (data && data.players) {
              const playerIds = data.players.map(p => p.id);
              
              const updateTransaction = db.transaction(() => {
                  for (const playerId of playerIds) {
                      updateOwner.run({
                          owner_id: user.id,
                          player_id: playerId
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
