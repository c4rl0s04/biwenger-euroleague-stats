import { biwengerFetch } from '../api/biwenger-client.js';
import { CONFIG } from '../config.js';

/**
 * Syncs board history (transfers, porras, etc.) incrementally.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} playersList - Map of player IDs to player objects
 * @param {Object} teams - Map of team IDs to team objects
 */
export async function syncBoard(db, playersList, teams) {
    console.log('\n📥 Fetching Full Board History...');
    
    // Check for existing transfers to do incremental sync
    // We use fichajes timestamp as the anchor for now, assuming board is sequential
    const lastTransfer = db.prepare('SELECT MAX(timestamp) as ts FROM fichajes').get();
    const lastTimestamp = lastTransfer ? lastTransfer.ts : 0;
    
    if (lastTimestamp > 0) {
        console.log(`Found existing data up to ${new Date(lastTimestamp * 1000).toISOString()}. Syncing only new...`);
    } else {
        console.log('No existing data. Doing full sync...');
    }

    const insertTransfer = db.prepare(`
      INSERT OR IGNORE INTO fichajes (timestamp, fecha, player_id, precio, vendedor, comprador)
      VALUES (@timestamp, @fecha, @player_id, @precio, @vendedor, @comprador)
    `);

    const insertBid = db.prepare(`
      INSERT INTO transfer_bids (transfer_id, bidder_id, bidder_name, amount)
      VALUES (@transfer_id, @bidder_id, @bidder_name, @amount)
    `);

    const insertPorra = db.prepare(`
      INSERT OR IGNORE INTO porras (user_id, round_id, round_name, result, aciertos)
      VALUES (@user_id, @round_id, @round_name, @result, @aciertos)
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
    let totalPorras = 0;
    let skippedOld = 0;

    // Helper to get league ID for raw fetch
    const leagueId = CONFIG.API.LEAGUE_ID;
    if (!leagueId) {
        throw new Error('BIWENGER_LEAGUE_ID is not defined in .env');
    }

    while (moreTransfers) {
      console.log(`Fetching batch (offset: ${offset})...`);
      // Fetch WITHOUT type filter to get everything (transfers, market, movements, bettingPool)
      const response = await biwengerFetch(`/league/${leagueId}/board?offset=${offset}&limit=${limit}`);
      const items = response.data;
      
      if (!items || items.length === 0) {
        moreTransfers = false;
        break;
      }

      db.transaction(() => {
        for (const t of items) {
          // Filter for relevant types
          if (!['transfer', 'market', 'playerMovements', 'bettingPool'].includes(t.type)) continue;
          
          // Some events might not have content or be different
          if (!t.content) continue;

          // Handle Betting Pool (Porras)
          if (t.type === 'bettingPool') {
             // Structure: content.pool.responses[]
             // content.pool.round { id, name }
             const pool = t.content.pool;
             if (!pool || !pool.responses) continue;

             const roundId = pool.round ? pool.round.id : null;
             const roundName = pool.round ? pool.round.name : 'Unknown Round';

             // Check timestamp for incremental sync (using event date)
             if (t.date <= lastTimestamp) {
                 moreTransfers = false;
                 skippedOld++;
                 continue;
             }

             for (const response of pool.responses) {
                 try {
                     const userId = response.id;
                     // const userName = response.name;
                     
                     // Results: ["1", "2", ...] -> "1-2-..."
                     let result = response.response;
                     if (Array.isArray(result)) {
                         result = result.join('-');
                     }
                     
                     const hits = response.hits !== undefined ? response.hits : null;

                     if (userId && roundId) {
                         insertPorra.run({
                             user_id: userId.toString(),
                             round_id: roundId,
                             round_name: roundName,
                             result: result || '',
                             aciertos: hits
                         });
                         totalPorras++;
                     }
                 } catch (e) {
                     // console.error('Error processing porra:', e);
                 }
             }
             continue; // Done with bettingPool
          }

          // Handle Transfers
          if (!Array.isArray(t.content)) continue;

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

            // Check if player exists, if not skip
            if (!playersList[playerId]) {
              // console.warn(`⚠️ Player ${playerId} not found. Skipping transfer.`);
              continue;
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

            const info = insertTransfer.run({
              timestamp: timestamp,
              fecha: date,
              player_id: playerId,
              precio: content.amount || 0,
              vendedor: fromName,
              comprador: toName
            });
            
            // If transfer was inserted (not ignored), insert bids
            if (info.changes > 0 && content.bids && Array.isArray(content.bids)) {
                const transferId = info.lastInsertRowid;
                
                for (const bid of content.bids) {
                    try {
                        const bidderId = bid.user ? (bid.user.id || bid.user) : null;
                        const bidderName = bid.user ? (bid.user.name || 'Unknown') : 'Unknown';
                        
                        insertBid.run({
                            transfer_id: transferId,
                            bidder_id: bidderId ? bidderId.toString() : null,
                            bidder_name: bidderName,
                            amount: bid.amount || 0
                        });
                    } catch (e) {
                        // Ignore bid errors
                    }
                }
            }
            
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
    console.log(`✅ Board synced (${totalTransfers} transfers, ${totalPorras} porras).`);
}
