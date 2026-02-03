
import 'dotenv/config';
import { db } from '../src/lib/db/client.js';

async function checkDataHealth() {
  console.log('🏥 STARTING DATABASE HEALTH CHECK...\n');

  try {
    // 1. Check for Matches with NULL Dates
    console.log('1️⃣  Checking for Matches with NULL Dates...');
    const nullDates = await db.query(`
      SELECT COUNT(*) as count, STRING_AGG(id::text, ', ' ORDER BY id) as ids
      FROM matches 
      WHERE date IS NULL
    `);
    
    if (parseInt(nullDates.rows[0].count) > 0) {
      console.error(`❌ FOUND ${nullDates.rows[0].count} MATCHES WITH NULL DATE!`);
      console.error(`   IDs: ${nullDates.rows[0].ids}`);
    } else {
      console.log('✅ No matches with NULL date found.');
    }

    // 2. Check for Rounds without Matches
    console.log('\n2️⃣  Checking for Rounds without Matches used in stats...');
    const orphanedRounds = await db.query(`
      SELECT DISTINCT prs.round_id 
      FROM player_round_stats prs
      LEFT JOIN matches m ON prs.round_id = m.round_id
      WHERE m.id IS NULL
    `);

    if (orphanedRounds.rowCount > 0) {
      console.warn(`⚠️  FOUND ${orphanedRounds.rowCount} ROUNDS IN STATS WITHOUT MATCHES:`);
      console.warn(`   Round IDs: ${orphanedRounds.rows.map(r => r.round_id).join(', ')}`);
    } else {
      console.log('✅ All rounds in stats have associated matches.');
    }

    // 3. Round ID vs Date Chronology
    console.log('\n3️⃣  Checking Round ID vs Date Chronology...');
    const roundDates = await db.query(`
      SELECT 
        round_id, 
        MIN(date) as first_match,
        MAX(date) as last_match,
        COUNT(*) as matches_count
      FROM matches
      WHERE date IS NOT NULL
      GROUP BY round_id
      ORDER BY MIN(date) ASC
    `);

    console.log('   (Listing Rounds sorted by DATE - check if Round IDs are sequential)');
    console.table(roundDates.rows.map(r => ({
      round: r.round_id,
      date: new Date(r.first_match).toISOString().split('T')[0],
      count: r.matches_count
    })));

  } catch (err) {
    console.error('Fatal Error during audit:', err);
  } finally {
    process.exit();
  }
}

checkDataHealth();
