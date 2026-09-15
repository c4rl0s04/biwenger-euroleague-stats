import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { assertFixtureTarget } from './safety.mjs';
import { validateSchemaReady } from '../../src/lib/db/schema_init';

const connectionString = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL or E2E_DATABASE_URL is required for upgrade rehearsal.');
}

assertFixtureTarget(connectionString, process.env);
const pool = new pg.Pool({ connectionString });

console.log('🧪 Starting populated pre-0014 database upgrade rehearsal...');

try {
  // 1. Role setup for disposable PostgreSQL
  await pool.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;"
  );

  const root = path.resolve(import.meta.dirname, '../..');
  const journal = JSON.parse(readFileSync(path.join(root, 'drizzle/meta/_journal.json'), 'utf8'));

  // 2. Apply migrations 0000 through 0013
  console.log('   Applying migrations up to 0013...');
  for (const entry of journal.entries) {
    if (entry.idx > 13) continue; // Stop before 0014
    const sql = readFileSync(path.join(root, 'drizzle', `${entry.tag}.sql`), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
  }

  // 3. Verify that at 0013, deprecated seasonal columns exist on players and teams
  console.log('   Verifying deprecated columns exist at migration 0013...');
  const playerCols0013 = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name IN ('position', 'puntos', 'partidos_jugados', 'price', 'team_id', 'status', 'price_increment')`
  );
  if (playerCols0013.rows.length !== 7) {
    throw new Error(
      `Expected 7 deprecated columns on players at 0013, found ${playerCols0013.rows.length}`
    );
  }

  const teamCols0013 = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name IN ('city', 'arena_name', 'latitude', 'longitude')`
  );
  if (teamCols0013.rows.length !== 4) {
    throw new Error(
      `Expected 4 deprecated columns on teams at 0013, found ${teamCols0013.rows.length}`
    );
  }
  console.log('   ✅ Deprecated columns verified present at migration 0013.');

  // 4. Seed baseline data and populate deprecated columns
  console.log('   Seeding legacy data into deprecated columns...');
  await pool.query(
    `INSERT INTO seasons (id, name, status, is_sync_enabled, euroleague_code, source_league_id)
     VALUES ('2025-26', 'EuroLeague 2025-26', 'active', true, 'E2025', '123')
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO teams (id, name, short_name, code, img, city, arena_name, latitude, longitude)
     VALUES (8801, 'Upgrade Madrid', 'Madrid', 'MAD', '/img.png', 'Madrid City', 'WiZink Arena', 40.42, -3.67)`
  );

  await pool.query(
    `INSERT INTO players (id, name, img, position, puntos, partidos_jugados, price, team_id, status, price_increment)
     VALUES (88101, 'Upgrade Guard', '/img.png', '1', 55, 3, 2000000, 8801, 'ok', 50000)`
  );

  // 5. Simulate data backfill to player_seasons and team_seasons before column drop
  console.log('   Backfilling data to player_seasons and team_seasons...');
  await pool.query(
    `INSERT INTO team_seasons (season_id, team_id, city, arena_name, latitude, longitude)
     VALUES ('2025-26', 8801, 'Madrid City', 'WiZink Arena', 40.42, -3.67)`
  );

  await pool.query(
    `INSERT INTO player_seasons (season_id, player_id, team_id, position, puntos, partidos_jugados, price, price_increment, status)
     VALUES ('2025-26', 88101, 8801, '1', 55, 3, 2000000, 50000, 'ok')`
  );
  console.log('   ✅ Legacy data seeded and backfilled.');

  // 6. Apply migrations 0014 and 0015
  console.log('   Applying migration 0014 (dropping deprecated columns) and 0015...');
  for (const entry of journal.entries) {
    if (entry.idx < 14) continue;
    const sql = readFileSync(path.join(root, 'drizzle', `${entry.tag}.sql`), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
  }
  console.log('   ✅ Migration 0014 and 0015 applied successfully.');

  // 7. Verify deprecated columns are completely gone
  console.log('   Verifying absence of deprecated columns on players and teams...');
  const playerColsAfter = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name IN ('position', 'puntos', 'partidos_jugados', 'price', 'team_id', 'status', 'price_increment')`
  );
  if (playerColsAfter.rows.length > 0) {
    throw new Error(
      `Table players still has dropped columns: ${playerColsAfter.rows.map((r) => r.column_name).join(', ')}`
    );
  }

  const teamColsAfter = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name IN ('city', 'arena_name', 'latitude', 'longitude')`
  );
  if (teamColsAfter.rows.length > 0) {
    throw new Error(
      `Table teams still has dropped columns: ${teamColsAfter.rows.map((r) => r.column_name).join(', ')}`
    );
  }
  console.log('   ✅ Dropped columns confirmed absent.');

  // 8. Verify data in player_seasons and team_seasons remains intact
  console.log('   Verifying data intact in player_seasons and team_seasons...');
  const playerSeasonRes = await pool.query(
    `SELECT season_id, player_id, team_id, position, puntos, partidos_jugados, price, price_increment, status
     FROM player_seasons WHERE player_id = 88101 AND season_id = '2025-26'`
  );
  const psRow = playerSeasonRes.rows[0];
  if (
    !psRow ||
    psRow.team_id !== 8801 ||
    Number(psRow.price) !== 2000000 ||
    psRow.puntos !== 55 ||
    psRow.partidos_jugados !== 3 ||
    psRow.status !== 'ok'
  ) {
    throw new Error(`player_seasons data corrupted or missing: ${JSON.stringify(psRow)}`);
  }

  const teamSeasonRes = await pool.query(
    `SELECT season_id, team_id, city, arena_name, latitude, longitude
     FROM team_seasons WHERE team_id = 8801 AND season_id = '2025-26'`
  );
  const tsRow = teamSeasonRes.rows[0];
  if (!tsRow || tsRow.city !== 'Madrid City' || tsRow.arena_name !== 'WiZink Arena') {
    throw new Error(`team_seasons data corrupted or missing: ${JSON.stringify(tsRow)}`);
  }
  console.log('   ✅ Seasonal state intact in player_seasons and team_seasons.');

  // 9. Verify new migration 0015 columns exist
  console.log('   Verifying migration 0015 schema additions...');
  const matchVenues = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'matches'
       AND column_name IN ('arena_code', 'arena_name', 'arena_capacity')`
  );
  if (matchVenues.rows.length !== 3) {
    throw new Error(`Expected 3 venue columns in matches, got ${matchVenues.rows.length}`);
  }

  const prsNewCols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'player_round_stats'
       AND column_name IN ('is_dnp', 'official_game_code')`
  );
  if (prsNewCols.rows.length !== 2) {
    throw new Error(
      `Expected is_dnp and official_game_code in player_round_stats, got ${prsNewCols.rows.length}`
    );
  }
  console.log('   ✅ Migration 0015 columns verified present.');

  // 10. Run read-only schema readiness validation
  console.log('   Running validateSchemaReady...');
  const validationResult = await validateSchemaReady(pool);
  if (!validationResult.ready) {
    throw new Error('validateSchemaReady failed post-upgrade.');
  }
  console.log('   ✅ validateSchemaReady passed.');

  console.log('🎉 Populated pre-0014 database upgrade rehearsal PASSED successfully!');
} finally {
  await pool.end();
}
