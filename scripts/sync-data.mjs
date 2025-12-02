import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Database from 'better-sqlite3';
import { syncPlayers } from '../src/lib/sync/sync-players.js';
import { syncStandings } from '../src/lib/sync/sync-standings.js';
import { syncSquads } from '../src/lib/sync/sync-squads.js';
import { syncImages } from '../src/lib/sync/sync-images.js';
import { syncBoard } from '../src/lib/sync/sync-board.js';
import { syncMatches } from '../src/lib/sync/sync-matches.js';
import { syncLineups } from '../src/lib/sync/sync-lineups.js';
import { ensureSchema } from '../src/lib/sync/ensure-schema.js';
import { CONFIG } from '../src/lib/config.js';

const DB_PATH = CONFIG.DB.PATH;

async function syncData() {
  console.log('🚀 Starting Biwenger Data Sync...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 0. Ensure Schema (Create tables if not exist)
    ensureSchema(db);

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

    // 5. Sync Player Images (TheSportsDB)
    await syncImages(db);

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
        
        let totalLineupsInserted = 0;

        for (const round of rounds) {
             const roundName = round.name;
             const status = round.status;

             console.log(`\n--- Processing ${roundName} (${status}) ---`);

             if (roundName === 'GLOBAL') continue;

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
