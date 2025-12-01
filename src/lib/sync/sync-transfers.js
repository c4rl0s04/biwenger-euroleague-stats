import { biwengerFetch } from '../biwenger-client.js';
import { CONFIG } from '../config.js';

/**
 * Syncs transfer market history (fichajes) incrementally.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} playersList - Map of player IDs to player objects
 * @param {Object} teams - Map of team IDs to team objects
 */
export async function syncTransfers(db, playersList, teams) {
    console.log('\n📥 Fetching Full Board History...');
    
    // Check for existing transfers to do incremental sync
    const lastTransfer = db.prepare('SELECT MAX(timestamp) as ts FROM fichajes').get();
    const lastTimestamp = lastTransfer ? lastTransfer.ts : 0;
    
    if (lastTimestamp > 0) {
        console.log(`Found existing transfers up to ${new Date(lastTimestamp * 1000).toISOString()}. Syncing only new...`);
    } else {
        console.log('No existing transfers. Doing full sync...');
    }

    const insertTransfer = db.prepare(`
      INSERT OR IGNORE INTO fichajes (timestamp, fecha, player_id, precio, vendedor, comprador)
      VALUES (@timestamp, @fecha, @player_id, @precio, @vendedor, @comprador)
    `);

    // Helper to insert unknown players on the fly
    const insertPlayer = db.prepare(`
      INSERT INTO players (
        id, name, team, position, 
        puntos, partidos_jugados, 
        played_home, played_away, 
        points_home, points_away, points_last_season
      ) 
      VALUES (
        @id, @name, @team, @position, 
        @puntos, @partidos_jugados, 
        @played_home, @played_away, 
        @points_home, @points_away, @points_last_season
      )
      ON CONFLICT(id) DO NOTHING
    `);

    let offset = 0;
    const limit = 50;
    let moreTransfers = true;
    let totalTransfers = 0;
    let skippedOld = 0;

    // Helper to get league ID for raw fetch
    const leagueId = CONFIG.API.LEAGUE_ID;
    if (!leagueId) {
        throw new Error('BIWENGER_LEAGUE_ID is not defined in .env');
    }

    while (moreTransfers) {
      console.log(`Fetching batch (offset: ${offset})...`);
      // Fetch WITHOUT type filter to get everything (transfers, market, movements)
      const response = await biwengerFetch(`/league/${leagueId}/board?offset=${offset}&limit=${limit}`);
      const items = response.data;
      
      if (!items || items.length === 0) {
        moreTransfers = false;
        break;
      }

      db.transaction(() => {
        for (const t of items) {
          // Filter for relevant types
          // transfer: User <-> User
          // market: User <-> Market (Direct)
          // playerMovements: Admin/System moves
          if (!['transfer', 'market', 'playerMovements'].includes(t.type)) continue;
          
          // Some events might not have content or be different
          if (!t.content || !Array.isArray(t.content)) continue;

          for (const content of t.content) {
            const timestamp = t.date;
            
            // Incremental check: if we reach a transfer older or equal to what we have, stop
            if (timestamp <= lastTimestamp) {
                // We found a transfer we already have (or older). 
                // Since API returns newest first, we can stop fetching entirely.
                moreTransfers = false; 
                skippedOld++;
                continue; 
            }

            const date = new Date(timestamp * 1000).toISOString();
            const playerId = content.player;

            // Check if player exists, if not insert placeholder
            if (!playersList[playerId]) {
              // console.warn(`⚠️ Player ${playerId} not found. Inserting placeholder.`);
              try {
                insertPlayer.run({
                  id: playerId,
                  name: `Unknown Player (${playerId})`,
                  team: 'Unknown',
                  position: 'Unknown',
                  puntos: 0,
                  partidos_jugados: 0,
                  played_home: 0,
                  played_away: 0,
                  points_home: 0,
                  points_away: 0,
                  points_last_season: 0
                });
                playersList[playerId] = { name: `Unknown Player (${playerId})` };
              } catch (e) { }
            }
            
            // Determine From/To names safely
            let fromName = 'Mercado';
            let toName = 'Mercado';

            if (content.from) fromName = content.from.name;
            if (content.to) toName = content.to.name;

            // FILTER 1: Skip Mercado -> Mercado (Redundant)
            if (fromName === 'Mercado' && toName === 'Mercado') {
              // console.log('   Skipping Mercado->Mercado');
              continue;
            }

            // FILTER 2: Skip Real Teams (e.g. "Real Madrid" selling to "Mercado")
            // We only want User transactions (User->User, User->Mercado, Mercado->User)
            const teamNames = new Set(Object.values(teams).map(t => t.name));
            if (teamNames.has(fromName) || teamNames.has(toName)) {
              // console.log(`   Skipping Team transaction: ${fromName} -> ${toName}`);
              continue;
            }

            insertTransfer.run({
              timestamp: timestamp,
              fecha: date,
              player_id: playerId,
              precio: content.amount || 0,
              vendedor: fromName,
              comprador: toName
            });
            totalTransfers++;
          }
        }
      })();

      if (items.length < limit) {
        moreTransfers = false;
      } else {
        offset += limit;
      }
    }
    console.log(`✅ All transfers synced (${totalTransfers} processed).`);
}
