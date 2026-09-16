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
      'user_biwenger_credentials',
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
      '   ✅ Modern tables present (seasons, player_seasons, team_seasons, matches, player_round_stats, user_biwenger_credentials).'
    );

    // c) Legacy pre-0014 columns and pre-0016 biwenger_token are absent
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
    const deprecatedUserCols = ['biwenger_token', 'icon', 'color_index'];

    const deprecatedRes = await disposable.pool.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND (
         (table_name = 'players' AND column_name = ANY($1::text[])) OR
         (table_name = 'teams' AND column_name = ANY($2::text[])) OR
         (table_name = 'users' AND column_name = ANY($3::text[]))
       )`,
      [deprecatedPlayerCols, deprecatedTeamCols, deprecatedUserCols]
    );
    if (deprecatedRes.rows.length > 0) {
      const list = deprecatedRes.rows
        .map((r: any) => `${r.table_name}.${r.column_name}`)
        .join(', ');
      throw new Error(`Deprecated columns still present on global tables: ${list}`);
    }
    console.log(
      '   ✅ All deprecated columns on players, teams, and users (including users.biwenger_token, users.icon, users.color_index) are confirmed absent.'
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

    // f) User seasons normalization: composite PK (season_id, user_id), no id column, no unique_user_season constraint
    const userSeasonsPkRes = await disposable.pool.query(
      `SELECT pg_get_constraintdef(c.oid) as def
       FROM pg_constraint c
       WHERE c.contype = 'p' AND c.conrelid = 'user_seasons'::regclass`
    );
    if (
      userSeasonsPkRes.rows.length !== 1 ||
      !userSeasonsPkRes.rows[0].def.includes('(season_id, user_id)')
    ) {
      throw new Error(
        `Expected user_seasons composite primary key (season_id, user_id), got: ${userSeasonsPkRes.rows[0]?.def}`
      );
    }

    const userSeasonsIdColRes = await disposable.pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'user_seasons' AND column_name = 'id'`
    );
    if (userSeasonsIdColRes.rowCount !== 0) {
      throw new Error('user_seasons.id column still exists; expected dropped surrogate ID.');
    }

    const redundantConstraintRes = await disposable.pool.query(
      `SELECT conname FROM pg_constraint
       WHERE conname = 'unique_user_season' AND conrelid = 'user_seasons'::regclass`
    );
    if (redundantConstraintRes.rowCount !== 0) {
      throw new Error('unique_user_season constraint still exists on user_seasons.');
    }
    console.log(
      '   ✅ user_seasons composite PK (season_id, user_id) verified; surrogate id and redundant unique constraint confirmed absent.'
    );

    // g) user_seasons column constraints (name NOT NULL, color_index NOT NULL DEFAULT 0, status NOT NULL DEFAULT 'active')
    const userSeasonsColsRes = await disposable.pool.query(
      `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'user_seasons' AND column_name = ANY(ARRAY['name', 'color_index', 'status'])`
    );
    const colMap = new Map(userSeasonsColsRes.rows.map((r: any) => [r.column_name, r]));
    const nameCol = colMap.get('name');
    const colorCol = colMap.get('color_index');
    const statusCol = colMap.get('status');
    if (!nameCol || nameCol.is_nullable !== 'NO') {
      throw new Error(
        `user_seasons.name must be NOT NULL, got is_nullable=${nameCol?.is_nullable}`
      );
    }
    if (!colorCol || colorCol.is_nullable !== 'NO' || !colorCol.column_default?.includes('0')) {
      throw new Error(
        `user_seasons.color_index must be NOT NULL DEFAULT 0, got is_nullable=${colorCol?.is_nullable}, default=${colorCol?.column_default}`
      );
    }
    if (
      !statusCol ||
      statusCol.is_nullable !== 'NO' ||
      !statusCol.column_default?.includes('active')
    ) {
      throw new Error(
        `user_seasons.status must be NOT NULL DEFAULT 'active', got is_nullable=${statusCol?.is_nullable}, default=${statusCol?.column_default}`
      );
    }
    console.log(
      "   ✅ user_seasons column constraints verified (name NOT NULL, color_index NOT NULL DEFAULT 0, status NOT NULL DEFAULT 'active')."
    );

    // h) Composite foreign keys referencing user_seasons(season_id, user_id)
    const expectedFkConstraints = [
      'finances_season_user_fk',
      'initial_squads_season_user_fk',
      'lineups_season_user_fk',
      'market_listings_season_seller_fk',
      'player_seasons_season_owner_fk',
      'playoff_predictions_season_user_fk',
      'porras_season_user_fk',
      'tournament_fixtures_season_home_user_fk',
      'tournament_fixtures_season_away_user_fk',
      'tournament_standings_season_user_fk',
      'transfer_bids_season_bidder_fk',
      'user_playoff_media_season_user_fk',
      'user_rounds_season_user_fk',
    ];
    const fkRes = await disposable.pool.query(
      `SELECT conname, pg_get_constraintdef(c.oid) as def
       FROM pg_constraint c
       WHERE c.contype = 'f' AND c.confrelid = 'user_seasons'::regclass`
    );
    const existingFks = new Set(fkRes.rows.map((r: any) => r.conname));
    const missingFks = expectedFkConstraints.filter((fk) => !existingFks.has(fk));
    if (missingFks.length > 0) {
      throw new Error(
        `Missing composite foreign keys referencing user_seasons: ${missingFks.join(', ')}`
      );
    }
    console.log(
      `   ✅ All ${expectedFkConstraints.length} composite foreign keys referencing user_seasons(season_id, user_id) confirmed present.`
    );

    // g) Supabase data access lockdown: RLS enabled on all public tables, zero grants to anon/authenticated
    const rlsRes = await disposable.pool.query(
      `SELECT c.relname as table_name, c.relrowsecurity as rls_enabled
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r'
       ORDER BY c.relname`
    );
    const tablesWithoutRls = rlsRes.rows
      .filter((r: any) => !r.rls_enabled)
      .map((r: any) => r.table_name);
    if (tablesWithoutRls.length > 0) {
      throw new Error(
        `Tables in schema public without RLS enabled: ${tablesWithoutRls.join(', ')}`
      );
    }
    console.log(
      `   ✅ All ${rlsRes.rows.length} public tables have Row Level Security enabled (relrowsecurity = true).`
    );

    const unsafeGrantsRes = await disposable.pool.query(
      `SELECT table_name, grantee, privilege_type
       FROM information_schema.role_table_grants
       WHERE table_schema = 'public'
         AND grantee IN ('anon', 'authenticated')`
    );
    if (unsafeGrantsRes.rows.length > 0) {
      const list = unsafeGrantsRes.rows
        .map((r: any) => `${r.table_name}.${r.grantee}.${r.privilege_type}`)
        .join(', ');
      throw new Error(`Unsafe table grants found for anon/authenticated: ${list}`);
    }
    console.log(
      '   ✅ Zero table grants for anon/authenticated roles confirmed across all public tables.'
    );

    const unsafeSeqGrantsRes = await disposable.pool.query(
      `SELECT sequence_info.relname AS sequence_name,
              role_info.rolname AS grantee,
              privilege_info.privilege_type
       FROM pg_class sequence_info
       JOIN pg_namespace namespace_info ON namespace_info.oid=sequence_info.relnamespace
       CROSS JOIN pg_roles role_info
       CROSS JOIN (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS privilege_info(privilege_type)
       WHERE namespace_info.nspname='public'
         AND sequence_info.relkind='S'
         AND role_info.rolname IN ('anon','authenticated')
         AND has_sequence_privilege(
           role_info.rolname,
           sequence_info.oid,
           privilege_info.privilege_type
         )`
    );
    if (unsafeSeqGrantsRes.rows.length > 0) {
      const list = unsafeSeqGrantsRes.rows
        .map((r: any) => `${r.sequence_name}.${r.grantee}.${r.privilege_type}`)
        .join(', ');
      throw new Error(`Unsafe sequence grants found for anon/authenticated: ${list}`);
    }
    console.log(
      '   ✅ Zero sequence grants for anon/authenticated roles confirmed across all public sequences.'
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
