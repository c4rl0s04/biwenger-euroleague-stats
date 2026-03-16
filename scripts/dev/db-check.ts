import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const TABLES = [
  'users',
  'teams',
  'players',
  'user_rounds',
  'fichajes',
  'lineups',
  'matches',
  'player_round_stats',
  'porras',
  'market_values',
  'transfer_bids',
  'initial_squads',
  'finances',
  'player_mappings',
  'sync_meta',
  'tournaments',
  'tournament_phases',
  'tournament_fixtures',
  'tournament_standings',
  'market_listings',
];

async function runDiagnostic() {
  console.log('\n🔍 --- Database Diagnostic Tool ---');

  // Dynamically import db after dotenv
  const { db } = await import('../../src/lib/db/index.js');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('📡 Testing connectivity...');
  console.log(
    '   Connection check:',
    connectionString.includes('supabase.com') ? 'Remote (Supabase)' : 'Local/Other'
  );

  try {
    const startTime = Date.now();
    const serverTime = await db.execute(sql`SELECT NOW()`);
    const duration = Date.now() - startTime;
    console.log(`✅ Connection successful! (Time: ${duration}ms)`);
    console.log(`🕒 Server Time: ${serverTime.rows[0].now}`);
  } catch (error) {
    const err = error as any;
    console.error('❌ Connectivity test failed!');
    console.error('   Error:', err.message);
    if (err.cause) {
      console.error('   Cause:', err.cause.message || err.cause);
    }
    if (
      err.message?.includes('circuit breaker') ||
      err.cause?.message?.includes('circuit breaker')
    ) {
      console.log(
        '   💡 Suggestion: Supabase has locked the connection. Wait 2 minutes and retry.'
      );
    } else if (err.message?.includes('SSL') || err.cause?.message?.includes('SSL')) {
      console.log('   💡 Suggestion: There is an SSL mismatch. Check your migration of client.ts.');
    } else if (
      err.message?.includes('authentication failed') ||
      err.cause?.message?.includes('authentication failed')
    ) {
      console.log('   💡 Suggestion: The password in your .env might still be incorrect.');
    }
    process.exit(1);
  }

  console.log('\n📊 Checking Tables...');
  let missingTables = 0;
  for (const tableName of TABLES) {
    try {
      const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM "${tableName}"`));
      const count = countRes.rows[0].total;
      console.log(`   ✅ Table "${tableName}": ${count} records`);
    } catch (err) {
      const errorMsg = (err as Error).message.split('\n')[0];
      console.log(`   ❌ Table "${tableName}": MISSING or error (${errorMsg})`);
      missingTables++;
    }
  }

  console.log('\n🗺️  Checking Team Location Columns (Revert Status)...');
  try {
    const colRes = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name IN ('latitude', 'longitude', 'city', 'arena_name')
    `);

    if (colRes.rows.length > 0) {
      console.log(
        '   ⚠️  Note: Extra columns from Map feature still exist in DB (ignored by code):'
      );
      colRes.rows.forEach((col: any) =>
        console.log(`      - ${col.column_name} (${col.data_type})`)
      );
    } else {
      console.log('   ✅ No Map-related columns found in the "teams" table.');
    }
  } catch (err) {
    console.log('   ❓ Could not check table structure.');
  }

  console.log('\n🏁 Diagnostic Summary:');
  if (missingTables === 0) {
    console.log('✅ ALL SYSTEMS CLEAR: Database is healthy and synchronized.');
  } else {
    console.log(`⚠️  WARNING: ${missingTables} tables are missing or inaccessible.`);
  }

  process.exit(0);
}

runDiagnostic();
