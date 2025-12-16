import dotenv from 'dotenv';
// Try to load .env.local (for local dev), but don't fail if missing (Docker uses env vars directly)
dotenv.config({ path: '../../../.env.local' });

import Database from 'better-sqlite3';
import { syncPlayers } from './sync-players.js';
import { syncStandings } from './sync-standings.js';
import { syncSquads } from './sync-squads.js';
import { syncBoard } from './sync-board.js';
import { syncMatches } from './sync-matches.js';
import { syncLineups } from './sync-lineups.js';
import { cleanupDuplicateRounds } from './cleanup-rounds.js';
import { ensureSchema } from '../db/schema.js';
import { CONFIG } from '../config.js';

// Validate environment before starting
if (!process.env.BIWENGER_TOKEN && !CONFIG.API.TOKEN) {
  console.error('❌ ERROR: BIWENGER_TOKEN is required!');
  console.error('   Set it in .env.local or as an environment variable.');
  process.exit(1);
}


const DB_PATH = CONFIG.DB.PATH;

async function syncData() {
  console.log('🚀 Starting Biwenger Data Sync...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 0. Ensure Schema (Create tables if not exist)
    ensureSchema(db);
    
    // 0.5 Cleanup any duplicate rounds from previous syncs
    cleanupDuplicateRounds(db);

    // 1. Sync Players (Required for Foreign Keys)
    // Returns competition data which contains rounds list and teams
    const competition = await syncPlayers(db);
    
    // 2. Sync Standings (Users)
    await syncStandings(db);

    // 3. Sync Squads (Current Ownership)
    await syncSquads(db);

    // 4. Sync Board (Transfers & Porras)
    // Needs players list and teams for filtering/placeholders
    const playersList = competition.data.data ? competition.data.data.players : competition.data.players;
    const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};
    await syncBoard(db, playersList, teams);

    console.log('\n✅ Sync process completed successfully!');

    // 5. Sync Lineups and Matches
    console.log('\n📥 Syncing Lineups...');

    // Get existing rounds to skip (incremental update for LINEUPS only)
    const existingLineupRoundsArr = db.prepare('SELECT DISTINCT round_id FROM lineups').pluck().all();
    const existingLineupRounds = new Set(existingLineupRoundsArr);
    const lastLineupRoundId = existingLineupRoundsArr.length > 0 ? Math.max(...existingLineupRoundsArr) : 0;
    
    // Get rounds list
    // Fetch rounds from competition data
    const rounds = competition.data.data ? competition.data.data.season.rounds : competition.data.season.rounds;
    
    if (!rounds) {
        console.error('Could not find rounds in competition data');
    } else {
        console.log(`Found ${rounds.length} rounds in competition data.`);
        
        // 0. Build Lookup Map for Canonical Rounds
        // Maps base round name (without "(aplazada)") to the first/lowest round ID
        const roundNameMap = {};
        for (const r of rounds) {
            const baseName = r.name.includes('(aplazada)') 
              ? r.name.replace(' (aplazada)', '').trim()
              : r.name;
            
            // Store the lowest ID for each base name (canonical)
            if (!roundNameMap[baseName] || r.id < roundNameMap[baseName]) {
                roundNameMap[baseName] = r.id;
            }
        }

        let totalLineupsInserted = 0;

        for (const round of rounds) {
             let roundName = round.name;
             const status = round.status;

             console.log(`\n--- Processing ${roundName} (${status}) ---`);

             if (roundName === 'GLOBAL') continue;

             // Extract base name (strip "(aplazada)" if present)
             const baseName = roundName.includes('(aplazada)') 
               ? roundName.replace(' (aplazada)', '').trim()
               : roundName;
             
             // Get canonical ID for this round name
             const canonicalId = roundNameMap[baseName];
             
             // If this round's ID doesn't match the canonical ID, merge it
             if (canonicalId && round.id !== canonicalId) {
                 console.log(`   -> 🔀 Merging round ${round.id} into ${canonicalId} (${baseName})`);
                 round.dbId = canonicalId;
                 round.name = baseName; // Clean name for display/db
                 roundName = baseName;  // Update local var for logging
             } else if (roundName.includes('(aplazada)')) {
                 // Clean the name even if we couldn't find canonical
                 console.warn(`   ⚠️ Found postponed round "${roundName}" but could not find original "${baseName}"`);
                 round.name = baseName;
             }

             // Sync Matches (and Player Stats) for ALL rounds
             // Pass playersList to handle missing players
             await syncMatches(db, round, playersList);
             
             // Sync Lineups (only if round is finished/active)
        // We pass playersList to filter out unknown players
        const inserted = await syncLineups(db, round, existingLineupRounds, lastLineupRoundId, playersList);
        totalLineupsInserted += inserted;
        }
        console.log(`✅ Lineups synced (${totalLineupsInserted} entries).`);
    }

  } catch (error) {
    console.error('❌ Sync Failed:', error);
  } finally {
    db.close();
  }
}

syncData();
