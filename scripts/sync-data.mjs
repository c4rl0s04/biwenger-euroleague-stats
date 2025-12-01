import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Database from 'better-sqlite3';
import { syncPlayers } from '../src/lib/sync/sync-players.js';
import { syncStandings } from '../src/lib/sync/sync-standings.js';
import { syncTransfers } from '../src/lib/sync/sync-transfers.js';
import { syncMatches } from '../src/lib/sync/sync-matches.js';
import { syncLineups } from '../src/lib/sync/sync-lineups.js';
import { ensureSchema } from '../src/lib/sync/ensure-schema.js';
import { CONFIG } from '../src/lib/config.js';

const DB_PATH = CONFIG.DB.PATH;

async function syncData() {
  console.log('🚀 Starting Biwenger Data Sync...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 1. Sync Players (Required for Foreign Keys)
    // Returns competition data which contains rounds list and teams
    const competition = await syncPlayers(db);
    
    // 2. Sync Standings (Users)
    await syncStandings(db);

    // 3. Sync Transfers
    // Needs players list and teams for filtering/placeholders
    const playersList = competition.data.data ? competition.data.data.players : competition.data.players;
    const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};
    await syncTransfers(db, playersList, teams);

    // 4. Ensure Schema (Tables for matches, lineups, etc.)
    ensureSchema(db);

    // 5. Sync Lineups and Matches
    console.log('\n📥 Syncing Lineups...');

    // Reset all lineup points to 0 as requested
    db.prepare('UPDATE lineups SET points = 0').run();

    // Get existing rounds to skip (incremental update for LINEUPS only)
    const existingLineupRoundsArr = db.prepare('SELECT DISTINCT round_id FROM lineups').pluck().all();
    const existingLineupRounds = new Set(existingLineupRoundsArr);
    const lastLineupRoundId = existingLineupRoundsArr.length > 0 ? Math.max(...existingLineupRoundsArr) : 0;
    
    // Get rounds list
    let allRounds = [];
    const compData = competition.data.data || competition.data;
    
    if (compData.rounds) {
        allRounds = compData.rounds;
    } else if (compData.season && compData.season.rounds) {
        allRounds = compData.season.rounds;
    }
    
    if (allRounds.length > 0) {
        console.log(`Found ${allRounds.length} rounds in competition data.`);
    } else {
        console.error('No rounds found in competition data. Lineups sync will be skipped.');
    }

    let totalLineupsInserted = 0;

    for (const round of allRounds) {
        const roundName = round.name;
        const status = round.status;

        console.log(`\n--- Processing ${roundName} (${status}) ---`);

        if (roundName === 'GLOBAL') continue;

        // Sync Matches
        await syncMatches(db, round);

        // Sync Lineups
        const inserted = await syncLineups(db, round, existingLineupRounds, lastLineupRoundId);
        totalLineupsInserted += inserted;
    }
    
    console.log(`✅ Lineups synced (${totalLineupsInserted} entries).`);

  } catch (error) {
    console.error('❌ Sync Failed:', error);
  } finally {
    db.close();
  }
}

syncData();
