import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startDisposablePostgres } from './disposable-postgres';
import { runMigrations } from './migrate';
import { validateSchemaReady } from '../../src/lib/db/schema-validation';

async function main() {
  console.log('🧪 Starting fresh local PostgreSQL database lifecycle test (test:db:local)...');
  const startTime = Date.now();

  const disposable = await startDisposablePostgres();
  console.log(
    `   Started disposable PostgreSQL on 127.0.0.1:${disposable.port} (${disposable.databaseName}).`
  );

  try {
    // 1. Verify fresh database is genuinely empty
    console.log('   Checking fresh database emptiness...');
    const emptyTablesRes = await disposable.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    if (emptyTablesRes.rowCount !== 0) {
      throw new Error(
        `Fresh database is not empty: found ${emptyTablesRes.rowCount} table(s) in public schema.`
      );
    }

    const drizzleSchemaRes = await disposable.pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle'"
    );
    if (drizzleSchemaRes.rowCount !== 0) {
      throw new Error('Fresh database already contains drizzle schema.');
    }
    console.log(
      '   ✅ Database is completely empty from zero (0 public tables, no drizzle schema).'
    );

    // 2. Apply all committed Drizzle migrations using canonical mechanism
    console.log('   Applying all committed Drizzle migrations...');
    await runMigrations(disposable.pool);
    console.log('   ✅ Migrations applied successfully via canonical runner.');

    // 3. Validate resulting schema with canonical validator
    console.log('   Running validateSchemaReady()...');
    const validationResult = await validateSchemaReady(disposable.pool);
    if (!validationResult?.ready) {
      throw new Error('validateSchemaReady() failed on migrated fresh database.');
    }
    console.log('   ✅ validateSchemaReady() passed.');

    // 4. High-value structural assertions
    console.log('   Running high-value structural assertions...');

    // a) Migration journal entry count
    const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json');
    const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
    const expectedMigrationCount = journal.entries.length;

    const migrationRows = await disposable.pool.query(
      'SELECT id, hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY id ASC'
    );
    if (migrationRows.rows.length !== expectedMigrationCount) {
      throw new Error(
        `Migration journal mismatch: expected ${expectedMigrationCount} migrations, found ${migrationRows.rows.length}.`
      );
    }
    console.log(
      `   ✅ Drizzle migration journal verified (${expectedMigrationCount} applied migrations).`
    );

    // b) Modern season schema tables exist
    const modernTables = [
      'seasons',
      'player_seasons',
      'team_seasons',
      'matches',
      'player_round_stats',
    ];
    const modernRes = await disposable.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [modernTables]
    );
    const foundTables = new Set(modernRes.rows.map((r: any) => r.table_name));
    const missingTables = modernTables.filter((t) => !foundTables.has(t));
    if (missingTables.length > 0) {
      throw new Error(`Missing modern season tables: ${missingTables.join(', ')}`);
    }
    console.log(
      '   ✅ Modern season-model tables present (seasons, player_seasons, team_seasons, matches, player_round_stats).'
    );

    // c) Legacy pre-0014 columns are absent
    const deprecatedPlayerCols = [
      'position',
      'puntos',
      'partidos_jugados',
      'played_home',
      'played_away',
      'points_home',
      'points_away',
      'points_last_season',
      'owner_id',
      'status',
      'price_increment',
      'price',
      'dorsal',
      'team_id',
    ];
    const deprecatedTeamCols = ['city', 'arena_name', 'latitude', 'longitude'];

    const deprecatedRes = await disposable.pool.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND (
         (table_name = 'players' AND column_name = ANY($1::text[])) OR
         (table_name = 'teams' AND column_name = ANY($2::text[]))
       )`,
      [deprecatedPlayerCols, deprecatedTeamCols]
    );
    if (deprecatedRes.rows.length > 0) {
      const list = deprecatedRes.rows
        .map((r: any) => `${r.table_name}.${r.column_name}`)
        .join(', ');
      throw new Error(`Deprecated columns still present on global tables: ${list}`);
    }
    console.log(
      '   ✅ All 18 deprecated pre-0014 columns on players and teams are confirmed absent.'
    );

    // d) Post-0015 venue and DNP provenance columns exist
    const matchVenueCols = ['arena_code', 'arena_name', 'arena_capacity'];
    const matchColsRes = await disposable.pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = ANY($1::text[])`,
      [matchVenueCols]
    );
    if (matchColsRes.rows.length !== matchVenueCols.length) {
      throw new Error(
        `Expected ${matchVenueCols.length} venue columns on matches, found ${matchColsRes.rows.length}`
      );
    }

    const prs0015Cols = ['is_dnp', 'official_game_code'];
    const prsColsRes = await disposable.pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'player_round_stats' AND column_name = ANY($1::text[])`,
      [prs0015Cols]
    );
    if (prsColsRes.rows.length !== prs0015Cols.length) {
      throw new Error(
        `Expected ${prs0015Cols.length} DNP provenance columns on player_round_stats, found ${prsColsRes.rows.length}`
      );
    }
    console.log(
      '   ✅ Post-0015 venue (matches) and DNP provenance (player_round_stats) columns confirmed present.'
    );

    // e) Abandoned official staging tables are absent
    const stagingTables = ['official_games', 'official_player_game_stats'];
    const stagingRes = await disposable.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [stagingTables]
    );
    if (stagingRes.rows.length > 0) {
      throw new Error(
        `Abandoned staging tables still exist: ${stagingRes.rows.map((r: any) => r.table_name).join(', ')}`
      );
    }
    console.log(
      '   ✅ Abandoned official staging tables confirmed absent (official_games, official_player_game_stats).'
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Fresh database lifecycle test PASSED in ${duration}s!`);
  } finally {
    console.log('   Tearing down disposable database...');
    await disposable.cleanup();
    console.log('   ✅ Disposable database cleaned up.');
  }
}

main().catch((error) => {
  console.error(
    '\n❌ test:db:local failed:',
    error instanceof Error ? error.stack || error.message : error
  );
  process.exit(1);
});
