
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Database from 'better-sqlite3';
import path from 'path';
import { fetchMarket, fetchLeague, fetchTransfers, fetchCompetition, biwengerFetch, fetchAllPlayers, fetchRoundsLeague } from '../src/lib/biwenger-client.js';

const DB_PATH = path.join(process.cwd(), 'data', 'local.db');

async function syncData() {
  console.log('🚀 Starting Biwenger Data Sync...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 1. Sync Players (Required for Foreign Keys)
    console.log('\n📥 Fetching Players Database...');
    const competition = await fetchAllPlayers();
    
    // Structure is usually data.data.players
    const playersList = competition.data.data ? competition.data.data.players : competition.data.players;
    
    if (!playersList) {
      throw new Error('Could not find players list in competition data');
    }

    console.log(`Found ${Object.keys(playersList).length} players. Updating DB...`);
    
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
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        team=excluded.team, 
        position=excluded.position,
        puntos=excluded.puntos,
        partidos_jugados=excluded.partidos_jugados,
        played_home=excluded.played_home,
        played_away=excluded.played_away,
        points_home=excluded.points_home,
        points_away=excluded.points_away,
        points_last_season=excluded.points_last_season
    `);

    // Also prepare to insert current price into market_values for ALL players
    const insertMarketValue = db.prepare(`
      INSERT OR IGNORE INTO market_values (player_id, price, date)
      VALUES (@player_id, @price, @date)
    `);
    
    const today = new Date().toISOString().split('T')[0];

    // Helper to map position ID to text
    // 1 -> Base, 2 -> Alero, 3 -> Pivot
    const positions = { 1: 'Base', 2: 'Alero', 3: 'Pivot', 4: 'Entrenador', 5: 'Entrenador' }; 
    const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

    db.transaction(() => {
      for (const [id, player] of Object.entries(playersList)) {
        // Insert Player
        insertPlayer.run({
          id: parseInt(id),
          name: player.name,
          team: teams[player.teamID]?.name || 'Unknown',
          position: positions[player.position] || 'Unknown',
          
          // New Stats
          puntos: player.points || 0,
          partidos_jugados: (player.playedHome || 0) + (player.playedAway || 0),
          played_home: player.playedHome || 0,
          played_away: player.playedAway || 0,
          points_home: player.pointsHome || 0,
          points_away: player.pointsAway || 0,
          points_last_season: player.pointsLastSeason || 0
        });

        // Insert Price (if exists)
        if (player.price) {
          insertMarketValue.run({
            player_id: parseInt(id),
            price: player.price,
            date: today
          });
        }
      }
    })();
    console.log('✅ Players and current prices synced.');

    // 2. Sync Standings (Users)
    console.log('\n📥 Fetching Standings...');
    const league = await fetchLeague();
    const standings = league.data.standings;
    
    const insertUserRound = db.prepare(`
      INSERT INTO user_rounds (user_id, round_name, points, participated)
      VALUES (@user_id, 'GLOBAL', @points, 1)
      ON CONFLICT(user_id, round_name) DO UPDATE SET points=excluded.points
    `);

    db.transaction(() => {
      for (const user of standings) {
        insertUserRound.run({
          user_id: user.id.toString(),
          points: user.points
        });
      }
    })();
    console.log(`✅ Standings synced (${standings.length} users).`);

    // 3. Sync Transfers (Full Board History)
    console.log('\n📥 Fetching Full Board History...');
    
    // Clear existing transfers to avoid duplicates/conflicts with new approach
    db.prepare('DELETE FROM fichajes').run();
    console.log('   (Cleared fichajes table)');

    const insertTransfer = db.prepare(`
      INSERT OR IGNORE INTO fichajes (timestamp, fecha, player_id, precio, vendedor, comprador)
      VALUES (@timestamp, @fecha, @player_id, @precio, @vendedor, @comprador)
    `);

    let offset = 0;
    const limit = 50;
    let moreTransfers = true;
    let totalTransfers = 0;

    // Helper to get league ID for raw fetch
    const leagueId = process.env.BIWENGER_LEAGUE_ID || '2028379';

    while (moreTransfers) {
      console.log(`   Fetching batch (offset: ${offset})...`);
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

    // 4. Sync Player Round Statistics (Simplified)
    // console.log('\n📥 Syncing Player Round Statistics...');
    
    // const insertPlayerStat = db.prepare(`
    //   INSERT OR REPLACE INTO player_round_stats (player_id, round_id, round_name, points)
    //   VALUES (@player_id, @round_id, @round_name, @points)
    // `);

    // let totalStatsInserted = 0;
    // let roundsProcessed = 0;
    // const startRoundId = 4746; // Jornada 1
    // const maxRounds = 40; // Safety limit

    // for (let roundId = startRoundId; roundId < startRoundId + maxRounds; roundId++) {
    //   try {
    //     const roundData = await biwengerFetch(`/rounds/euroleague/${roundId}?score=1&lang=es`);
        
    //     if (!roundData.data || !roundData.data.games) {
    //       console.log(`   Round ${roundId}: No data, stopping`);
    //       break;
    //     }

    //     const roundName = roundData.data.name || `Round ${roundId}`;
    //     console.log(`   Processing ${roundName} (ID: ${roundId})...`);

    //     // Aggregate player points across all games in this round
    //     const playerPoints = {}; // { playerId: totalPoints }

    //     db.transaction(() => {
    //       for (const game of roundData.data.games) {
    //         // Process home team players
    //         if (game.home && game.home.reports) {
    //           for (const report of game.home.reports) {
    //             const playerId = report.player.id;
    //             const points = report.points || 0;
                
    //             if (!playerPoints[playerId]) {
    //               playerPoints[playerId] = 0;
    //             }
    //             playerPoints[playerId] += points;
    //           }
    //         }
            
    //         // Process away team players
    //         if (game.away && game.away.reports) {
    //           for (const report of game.away.reports) {
    //             const playerId = report.player.id;
    //             const points = report.points || 0;
                
    //             if (!playerPoints[playerId]) {
    //               playerPoints[playerId] = 0;
    //             }
    //             playerPoints[playerId] += points;
    //           }
    //         }
    //       }

    //       // Insert aggregated stats for this round
    //       for (const [playerId, totalPoints] of Object.entries(playerPoints)) {
    //         const result = insertPlayerStat.run({
    //           player_id: parseInt(playerId),
    //           round_id: roundId,
    //           round_name: roundName,
    //           points: totalPoints
    //         });
    //         if (result.changes > 0) totalStatsInserted++;
    //       }
    //     })();

    //     roundsProcessed++;
        
    //   } catch (error) {
    //     if (error.message && error.message.includes('404')) {
    //       console.log(`   Round ${roundId}: Not found (future round), stopping`);
    //       break;
    //     }
    //     console.error(`   Error processing round ${roundId}:`, error.message);
    //   }
    // }

    // console.log(`✅ Player stats synced (${roundsProcessed} rounds, ${totalStatsInserted} players tracked).`);

    // 5. Sync Market (Current Sales) - DISABLED
    // The /market endpoint returns active listings in the league.
    // Structure: { data: { sales: [ { price: 123, player: { id: 1 }, ... } ] } }
    // We currently get official prices from fetchAllPlayers, so this is redundant unless
    // we want to track specific active sales/bids in the future.
    console.log('\nℹ️ Market sync skipped (redundant with players DB).');

    // 6. Sync Lineups (from /rounds/league/{id})
    console.log('\n📥 Syncing Lineups...');
    
    // Re-create lineups table to match new schema (drop role)
    db.prepare('DROP TABLE IF EXISTS lineups').run();
    db.prepare(`
      CREATE TABLE lineups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        round_name TEXT,
        player_id INTEGER,
        is_captain BOOLEAN,
        points INTEGER,
        UNIQUE(user_id, round_name, player_id),
        FOREIGN KEY(player_id) REFERENCES players(id)
      )
    `).run();

    // Create users table if not exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `).run();

    const insertLineup = db.prepare(`
      INSERT INTO lineups (user_id, round_name, player_id, is_captain, points)
      VALUES (@user_id, @round_name, @player_id, @is_captain, @points)
    `);

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name)
    `);

    let totalLineupsInserted = 0;
    const startRoundId = 4746; // Jornada 1
    const maxRounds = 40; // Safety limit

    for (let roundId = startRoundId; roundId < startRoundId + maxRounds; roundId++) {
      try {
        // console.log(`   Fetching Round ${roundId}...`);
        const roundData = await fetchRoundsLeague(roundId);
        
        // Determine where standings are
        let standings = null;
        let roundName = `Round ${roundId}`;

        if (roundData.data) {
            if (roundData.data.round) {
                if (roundData.data.round.name) {
                    roundName = roundData.data.round.name;
                }
                if (roundData.data.round.standings) {
                    standings = roundData.data.round.standings;
                }
            }
            if (!standings && roundData.data.league && roundData.data.league.standings) {
                standings = roundData.data.league.standings;
            }
            // Fallback for name if not found in round object but maybe in league object or just generic
            if (roundName === `Round ${roundId}` && roundData.data.name) {
                 roundName = roundData.data.name;
            }
        }

        if (!standings) {
            continue;
        }

        console.log(`   Processing ${roundName} (ID: ${roundId})...`);

        db.transaction(() => {
          for (const user of standings) {
            // Insert user info
            insertUser.run({
                id: user.id.toString(),
                name: user.name
            });

            if (user.lineup && user.lineup.players) {
              const captainId = user.lineup.captain ? user.lineup.captain.id : null;
              
              for (const playerId of user.lineup.players) {
                try {
                  insertLineup.run({
                    user_id: user.id.toString(),
                    round_name: roundName,
                    player_id: playerId,
                    is_captain: playerId === captainId ? 1 : 0,
                    points: 0 // Points per player not available in this view
                  });
                  totalLineupsInserted++;
                } catch (e) {
                  // Ignore duplicates
                }
              }
            }
          }
        })();

      } catch (error) {
        // Stop if we hit a 404 or similar error indicating end of rounds
        if (error.message && (error.message.includes('404') || error.message.includes('400'))) {
          console.log(`   Round ${roundId}: Not found (likely future), stopping.`);
          break;
        }
        console.error(`   Error processing round ${roundId}:`, error.message);
      }
    }
    
    console.log(`✅ Lineups synced (${totalLineupsInserted} entries).`);

  } catch (error) {
    console.error('❌ Sync Failed:', error);
  } finally {
    db.close();
  }
}

syncData();
