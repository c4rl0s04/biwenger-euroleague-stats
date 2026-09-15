import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { createCliDb } from '../../src/lib/db/cli';
import { validateSchemaReady } from '../../src/lib/db/schema-validation';
import * as schema from '../../src/lib/db/schema';

dotenv.config({ path: process.env.ENV_LOCAL_FILE || '.env.local' });
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const DIAGNOSTIC_TABLES = [
  'users',
  'teams',
  'players',
  'seasons',
  'player_seasons',
  'team_seasons',
  'user_seasons',
  'user_rounds',
  'matches',
  'player_round_stats',
  'market_values',
  'market_listings',
  'fichajes',
  'lineups',
  'porras',
  'tournaments',
  'sync_meta',
];

async function runDiagnostic() {
  console.log('\n🔍 --- Database Diagnostic Tool (db:check) ---');

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  console.log('📡 Testing connectivity...');
  console.log(
    '   Target environment:',
    connectionString &&
      !connectionString.includes('localhost') &&
      !connectionString.includes('127.0.0.1')
      ? 'Remote'
      : 'Local'
  );

  const { db, pool } = createCliDb();

  try {
    // 1. Connectivity & Server Time
    const startTime = Date.now();
    const serverTime = await db.execute(sql`SELECT NOW() as now`);
    const duration = Date.now() - startTime;
    console.log(`✅ PostgreSQL connection successful! (${duration}ms)`);
    console.log(`🕒 Server Time: ${serverTime.rows[0]?.now}`);

    // 2. Drizzle ORM Mapping Test
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    console.log(
      `✅ Drizzle ORM initialized and connected (Found ${userCount[0]?.count ?? 0} users in DB).`
    );

    // 3. Schema Readiness Validation
    console.log('\n📋 Validating schema readiness...');
    try {
      await validateSchemaReady(pool);
      console.log(
        '✅ Schema readiness: PASSED (all required tables and seasonal columns are present).'
      );
    } catch (schemaErr) {
      console.warn(
        `⚠️ Schema readiness warning: ${schemaErr instanceof Error ? schemaErr.message : schemaErr}`
      );
    }

    // 4. Core Table Record Counts
    console.log('\n📊 Checking Table Record Counts...');
    let accessibleTables = 0;
    for (const tableName of DIAGNOSTIC_TABLES) {
      try {
        const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM "${tableName}"`));
        const count = countRes.rows[0]?.total;
        console.log(`   ✅ Table "${tableName}": ${count} records`);
        accessibleTables++;
      } catch {
        console.log(`   ❌ Table "${tableName}": MISSING or inaccessible`);
      }
    }

    console.log('\n🏁 Diagnostic Summary:');
    console.log(`   Accessible tables: ${accessibleTables}/${DIAGNOSTIC_TABLES.length}`);
    console.log('✅ Diagnostic check complete.\n');
  } catch (error) {
    const err = error as any;
    console.error('\n❌ Connectivity or diagnostic test failed!');
    console.error('   Error:', err.message);
    if (err.cause) {
      console.error('   Cause:', err.cause.message || err.cause);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runDiagnostic();
