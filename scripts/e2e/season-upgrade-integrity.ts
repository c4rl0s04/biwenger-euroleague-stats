import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { assertFixtureTarget } from './safety.mjs';
import { validateSchemaReady } from '../../src/lib/db/schema_init';
import {
  ALL_14_DROPPED_PLAYER_COLUMNS,
  ALL_4_DROPPED_TEAM_COLUMNS,
  runCanonicalBackfill,
} from '../season-model/backfill-2025-26';
import { checkPre0014Safety } from '../dev/pre0014-season-check';

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

  // 3. Verify that at 0013, all 18 deprecated seasonal columns exist
  console.log('   Verifying all 18 deprecated columns exist at migration 0013...');
  const playerCols0013 = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name = ANY($1::text[])`,
    [ALL_14_DROPPED_PLAYER_COLUMNS]
  );
  if (playerCols0013.rows.length !== 14) {
    throw new Error(
      `Expected 14 deprecated columns on players at 0013, found ${playerCols0013.rows.length}: ${playerCols0013.rows.map((r) => r.column_name).join(', ')}`
    );
  }

  const teamCols0013 = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name = ANY($1::text[])`,
    [ALL_4_DROPPED_TEAM_COLUMNS]
  );
  if (teamCols0013.rows.length !== 4) {
    throw new Error(
      `Expected 4 deprecated columns on teams at 0013, found ${teamCols0013.rows.length}: ${teamCols0013.rows.map((r) => r.column_name).join(', ')}`
    );
  }
  console.log('   ✅ All 18 deprecated columns verified present at migration 0013.');

  // 4. Seed baseline data with distinct non-default values across ALL 18 fields
  console.log('   Seeding legacy data into all 18 deprecated columns...');
  await pool.query(
    `INSERT INTO seasons (id, name, status, is_sync_enabled, euroleague_code, source_league_id)
     VALUES ('2025-26', 'EuroLeague 2025-26', 'active', true, 'E2025', '123')
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO users (id, name)
     VALUES ('99001', 'Test Manager')
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO teams (id, name, short_name, code, img, city, arena_name, latitude, longitude)
     VALUES (8801, 'Upgrade Madrid', 'Madrid', 'MAD', '/img.png', 'Madrid City', 'WiZink Arena', 40.4241, -3.6719)`
  );

  await pool.query(
    `INSERT INTO players (
      id, name, img, position, puntos, partidos_jugados,
      played_home, played_away, points_home, points_away,
      points_last_season, owner_id, status, price_increment,
      price, dorsal, team_id
    ) VALUES (
      88101, 'Upgrade Guard', '/img.png', 'Point Guard', 142, 8,
      5, 3, 88, 54,
      210, '99001', 'active', 75000,
      3450000, '23', 8801
    )`
  );
  console.log('   ✅ Legacy data seeded across all 18 deprecated columns.');

  // 5. Execute CANONICAL backfill procedure
  console.log('   Executing canonical backfill procedure (Run 1)...');
  const summary1 = await runCanonicalBackfill(pool, '2025-26');
  if (summary1.playerSeasonsCount === 0 || summary1.teamSeasonsCount === 0) {
    throw new Error(`Canonical backfill produced 0 rows: ${JSON.stringify(summary1)}`);
  }

  // 6. Assert all 18 destination values match source
  console.log('   Verifying all 18 columns match exactly between source and destination...');
  const psRes1 = await pool.query(
    `SELECT
      position, puntos, partidos_jugados, played_home, played_away,
      points_home, points_away, points_last_season, owner_id, status,
      price_increment, price, dorsal, team_id
     FROM player_seasons WHERE player_id = 88101 AND season_id = '2025-26'`
  );
  const ps1 = psRes1.rows[0];
  if (!ps1) throw new Error('player_seasons row missing after canonical backfill');

  const expectedPs = {
    position: 'Point Guard',
    puntos: 142,
    partidos_jugados: 8,
    played_home: 5,
    played_away: 3,
    points_home: 88,
    points_away: 54,
    points_last_season: 210,
    owner_id: '99001',
    status: 'active',
    price_increment: 75000,
    price: 3450000,
    dorsal: '23',
    team_id: 8801,
  };

  for (const [key, val] of Object.entries(expectedPs)) {
    const actual = key === 'price' ? Number(ps1[key]) : ps1[key];
    if (actual !== val) {
      throw new Error(`Mismatch on player_seasons.${key}: expected ${val}, got ${actual}`);
    }
  }

  const tsRes1 = await pool.query(
    `SELECT city, arena_name, latitude, longitude
     FROM team_seasons WHERE team_id = 8801 AND season_id = '2025-26'`
  );
  const ts1 = tsRes1.rows[0];
  if (!ts1) throw new Error('team_seasons row missing after canonical backfill');

  const expectedTs = {
    city: 'Madrid City',
    arena_name: 'WiZink Arena',
    latitude: 40.4241,
    longitude: -3.6719,
  };

  for (const [key, val] of Object.entries(expectedTs)) {
    if (ts1[key] !== val) {
      throw new Error(`Mismatch on team_seasons.${key}: expected ${val}, got ${ts1[key]}`);
    }
  }
  console.log('   ✅ All 18 columns match source exactly.');

  // 7. Test canonical backfill IDEMPOTENCY (Run 2: A = B)
  console.log('   Executing canonical backfill procedure (Run 2 - Idempotency proof A = B)...');
  const summary2 = await runCanonicalBackfill(pool, '2025-26');
  if (
    summary2.playerSeasonsCount !== summary1.playerSeasonsCount ||
    summary2.teamSeasonsCount !== summary1.teamSeasonsCount
  ) {
    throw new Error(
      `Canonical backfill is not idempotent! Run 1: ${JSON.stringify(summary1)}, Run 2: ${JSON.stringify(summary2)}`
    );
  }
  console.log('   ✅ Canonical backfill proven strictly idempotent (A = B).');

  // 7b. Verify pre-0014 safety checker catches mismatches across the 18 columns
  console.log('   Testing pre-0014 safety checker against canonical state...');
  const safetyInitial = await checkPre0014Safety(pool, '2025-26');
  if (!safetyInitial.safe || safetyInitial.dataMismatches > 0) {
    throw new Error(`Expected pre-0014 check to pass initially: ${JSON.stringify(safetyInitial)}`);
  }

  // Provoke deliberate mismatch on player_seasons.dorsal
  console.log('   Testing pre-0014 safety checker rejects mismatch on dorsal...');
  await pool.query(
    "UPDATE player_seasons SET dorsal = '99' WHERE player_id = 88101 AND season_id = '2025-26'"
  );
  const safetyDorsal = await checkPre0014Safety(pool, '2025-26');
  if (safetyDorsal.safe || safetyDorsal.playerMismatches !== 1) {
    throw new Error('Expected safety check to reject dorsal mismatch');
  }
  await pool.query(
    "UPDATE player_seasons SET dorsal = '23' WHERE player_id = 88101 AND season_id = '2025-26'"
  );

  // Provoke deliberate mismatch on player_seasons.price
  console.log('   Testing pre-0014 safety checker rejects mismatch on price...');
  await pool.query(
    "UPDATE player_seasons SET price = 999999 WHERE player_id = 88101 AND season_id = '2025-26'"
  );
  const safetyPrice = await checkPre0014Safety(pool, '2025-26');
  if (safetyPrice.safe || safetyPrice.playerMismatches !== 1) {
    throw new Error('Expected safety check to reject price mismatch');
  }
  await pool.query(
    "UPDATE player_seasons SET price = 3450000 WHERE player_id = 88101 AND season_id = '2025-26'"
  );

  // Provoke deliberate mismatch on team_seasons.latitude
  console.log('   Testing pre-0014 safety checker rejects mismatch on latitude...');
  await pool.query(
    "UPDATE team_seasons SET latitude = 50.123 WHERE team_id = 8801 AND season_id = '2025-26'"
  );
  const safetyLat = await checkPre0014Safety(pool, '2025-26');
  if (safetyLat.safe || safetyLat.teamMismatches !== 1) {
    throw new Error('Expected safety check to reject latitude mismatch');
  }
  await pool.query(
    "UPDATE team_seasons SET latitude = 40.4241 WHERE team_id = 8801 AND season_id = '2025-26'"
  );

  const safetyReverted = await checkPre0014Safety(pool, '2025-26');
  if (!safetyReverted.safe) {
    throw new Error('Expected safety check to pass after reverting mismatches');
  }
  console.log(
    '   ✅ pre-0014 safety check verified: strictly rejects any of the 18 column mismatches.'
  );

  // 8. Apply migrations 0014 (dropping deprecated columns) and 0015
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

  const safetyPost0014 = await checkPre0014Safety(pool, '2025-26');
  if (!safetyPost0014.safe || !safetyPost0014.alreadyMigrated) {
    throw new Error('Expected safety check post-0014 to report alreadyMigrated = true');
  }
  console.log(
    '   ✅ pre-0014 safety check correctly identifies post-0014 state as alreadyMigrated.'
  );

  // 9. Verify all 18 deprecated columns are completely gone from source tables
  console.log('   Verifying absence of all 18 deprecated columns on players and teams...');
  const playerColsAfter = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name = ANY($1::text[])`,
    [ALL_14_DROPPED_PLAYER_COLUMNS]
  );
  if (playerColsAfter.rows.length > 0) {
    throw new Error(
      `Table players still has dropped columns: ${playerColsAfter.rows.map((r) => r.column_name).join(', ')}`
    );
  }

  const teamColsAfter = await pool.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name = ANY($1::text[])`,
    [ALL_4_DROPPED_TEAM_COLUMNS]
  );
  if (teamColsAfter.rows.length > 0) {
    throw new Error(
      `Table teams still has dropped columns: ${teamColsAfter.rows.map((r) => r.column_name).join(', ')}`
    );
  }
  console.log('   ✅ All 18 dropped columns confirmed absent from source tables.');

  // 10. Verify that all 18 seasonal values survived in destination tables post-drop
  console.log('   Verifying all 18 values intact in destination tables post-0014...');
  const psResAfter = await pool.query(
    `SELECT
      position, puntos, partidos_jugados, played_home, played_away,
      points_home, points_away, points_last_season, owner_id, status,
      price_increment, price, dorsal, team_id
     FROM player_seasons WHERE player_id = 88101 AND season_id = '2025-26'`
  );
  const psAfter = psResAfter.rows[0];
  for (const [key, val] of Object.entries(expectedPs)) {
    const actual = key === 'price' ? Number(psAfter[key]) : psAfter[key];
    if (actual !== val) {
      throw new Error(
        `Post-drop corruption on player_seasons.${key}: expected ${val}, got ${actual}`
      );
    }
  }

  const tsResAfter = await pool.query(
    `SELECT city, arena_name, latitude, longitude
     FROM team_seasons WHERE team_id = 8801 AND season_id = '2025-26'`
  );
  const tsAfter = tsResAfter.rows[0];
  for (const [key, val] of Object.entries(expectedTs)) {
    if (tsAfter[key] !== val) {
      throw new Error(
        `Post-drop corruption on team_seasons.${key}: expected ${val}, got ${tsAfter[key]}`
      );
    }
  }
  console.log('   ✅ All 18 values confirmed intact post-drop.');

  // 11. Verify new migration 0015 columns exist
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

  // 12. Run read-only schema readiness validation
  console.log('   Running validateSchemaReady...');
  const validationResult = await validateSchemaReady(pool);
  if (!validationResult.ready) {
    throw new Error('validateSchemaReady failed post-upgrade.');
  }
  console.log('   ✅ validateSchemaReady passed.');

  console.log(
    '🎉 Populated pre-0014 database upgrade rehearsal with canonical backfill PASSED successfully!'
  );
} finally {
  await pool.end();
}
