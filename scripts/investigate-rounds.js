
import 'dotenv/config';
import { db } from '../src/lib/db/client.js';

async function investigateRounds() {
  console.log('🕵️‍♂️ INVESTIGATING ROUNDS & DUPLICATES...\n');

  try {
    // 1. Check for 'rounds' table
    console.log('1️⃣  Checking if "rounds" table exists...');
    try {
      const roundsTable = await db.query('SELECT * FROM rounds ORDER BY id LIMIT 5');
      console.log('   ✅ "rounds" table EXISTS. Sample rows:');
      console.table(roundsTable.rows);

      console.log('\n   🔎 Searching for "Jornada 14" in rounds table:');
      const j14 = await db.query("SELECT * FROM rounds WHERE name ILIKE '%14%'");
      console.table(j14.rows);

    } catch (e) {
      console.log('   ❌ "rounds" table does NOT exist or is not accessible.');
    }

    // 2. Check matches for round_name
    console.log('\n2️⃣  Checking "matches" table for round info...');
    // We try to select round_name or similar if it exists
    try {
      // Check distinct round_ids and their dates/names if dynamic
      // Note: 'round_name' might not exist in matches, but let's try to infer from data
      // or check if there's a column for it.
      
      const distinctRounds = await db.query(`
        SELECT 
            round_id, 
            MIN(date) as first_match_date, 
            MAX(date) as last_match_date, 
            COUNT(*) as matches_count
        FROM matches 
        GROUP BY round_id 
        ORDER BY MIN(date) ASC
      `);
      
      console.log(`   Found ${distinctRounds.rowCount} distinct rounds in matches.`);
      
      // Look for the "Jornada 14" split (likely close in ID or Date?)
      // User said "Jornada 14" and "Jornada 14 aplazada"
      // Let's filter rounds around that date or see if we can find the "14" connection elsewhere.
      
      // If we don't have round names, we can't search by string "Jornada 14".
      // But maybe we can see if multiple round_ids share the same 'name' lookups if we had them.
    } catch (e) {
      console.error(e);
    }

    // 3. Check for specific Round 14 anomalies in player_round_stats
    // If stats are duplicated, maybe we see multiple rows for the same player in "Jornada 14"?
    // But how do we know which round_id is "Jornada 14"?
    
    // User mentioned: "The duplicated round is called Jornada14 aplazada"
    // This implies somewhere there IS a name.
    
    // Let's check `stats_round` or similar if it exists?
    // Or maybe the user implies `round` column in `player_round_stats`?
    console.log('\n3️⃣  Checking `player_round_stats` columns for round names...');
    try {
        const sampleStat = await db.query('SELECT * FROM player_round_stats LIMIT 1');
        const keys = Object.keys(sampleStat.rows[0]);
        console.log('   Columns:', keys.join(', '));
        
        if (keys.includes('round_name') || keys.includes('name')) {
             const rNames = await db.query(`
                SELECT DISTINCT round_id, ${keys.includes('round_name') ? 'round_name' : 'name'} 
                FROM player_round_stats 
                WHERE ${keys.includes('round_name') ? 'round_name' : 'name'} ILIKE '%14%'
                ORDER BY round_id
             `);
             console.table(rNames.rows);
        } else {
            console.log('   (No explicit name column found in stats)');
        }
    } catch (e) { console.error(e); }


  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    process.exit();
  }
}

investigateRounds();
