import fs from 'node:fs';
import path from 'node:path';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { Pool, PoolClient } from 'pg';

export const OFFICIAL_TABLES = [
  'official_games',
  'official_team_mappings',
  'official_player_mappings',
  'official_player_game_stats',
  'official_play_by_play',
  'official_shots',
  'official_team_standings',
] as const;

const OFFICIAL_SEQUENCES = OFFICIAL_TABLES.map((table) => `${table}_id_seq`);

const ALLOWED_LEGACY_COLUMNS = new Set(['players.profile_url', 'teams.is_active']);

const REQUIRED_UNIQUE_CONSTRAINTS = [
  ['users', 'users_email_unique', ['email']],
  ['user_rounds', 'unique_user_round', ['season_id', 'user_id', 'round_id']],
  [
    'fichajes',
    'unique_fichaje',
    ['season_id', 'timestamp', 'player_id', 'vendedor', 'comprador', 'precio'],
  ],
  ['initial_squads', 'unique_initial_squad', ['season_id', 'user_id', 'player_id']],
  ['lineups', 'unique_lineup', ['season_id', 'user_id', 'round_id', 'player_id']],
  ['market_listings', 'unique_market_listing', ['season_id', 'player_id', 'listed_at']],
  ['market_values', 'unique_player_date', ['season_id', 'player_id', 'date']],
  ['matches', 'unique_match', ['season_id', 'round_id', 'home_id', 'away_id']],
  ['matches', 'unique_match_official_game', ['season_id', 'official_game_code']],
  ['player_round_stats', 'unique_player_round_stat', ['season_id', 'player_id', 'round_id']],
  ['porras', 'unique_porra', ['season_id', 'user_id', 'round_id']],
  ['tournaments', 'unique_tournament', ['season_id', 'id']],
  ['tournament_phases', 'unique_tournament_phase', ['season_id', 'tournament_id', 'order_index']],
  ['tournament_fixtures', 'unique_tournament_fixture', ['season_id', 'tournament_id', 'id']],
  [
    'tournament_standings',
    'unique_tournament_standing',
    ['season_id', 'tournament_id', 'phase_name', 'group_name', 'user_id'],
  ],
  ['hoopgrid_challenges', 'hoopgrid_challenges_game_date_unique', ['game_date']],
  ['hoopgrid_guesses', 'unique_guess', ['challenge_id', 'user_id', 'cell_index']],
  [
    'playoff_predictions',
    'unique_playoff_prediction',
    ['season_id', 'user_id', 'stage', 'match_id'],
  ],
  ['playoff_results', 'unique_playoff_result', ['season_id', 'match_id']],
  ['user_playoff_media', 'unique_user_playoff_media', ['season_id', 'user_id']],
  [
    'official_player_mappings',
    'unique_official_player_mapping',
    ['season_id', 'provider', 'player_id'],
  ],
  ['official_team_mappings', 'unique_official_team_mapping', ['season_id', 'provider', 'team_id']],
] as const;

type DatabaseClient = Pool | PoolClient;

interface SnapshotColumn {
  name: string;
  type: string;
  notNull: boolean;
  default?: string | number | boolean;
}

interface SnapshotForeignKey {
  name: string;
  tableFrom: string;
  columnsFrom: string[];
  tableTo: string;
  columnsTo: string[];
}

interface SnapshotTable {
  columns?: Record<string, SnapshotColumn>;
  indexes?: Record<string, { name: string }>;
  foreignKeys?: Record<string, SnapshotForeignKey>;
}

interface MigrationManifestEntry {
  tag: string;
  when: number;
}

function normalizeDefault(value: unknown): string {
  return String(value)
    .replace(/::[a-z ]+(\[\])?/gi, '')
    .replace(/^\(([\s\S]*)\)$/, '$1')
    .trim();
}

function normalizeColumnType(value: string): string {
  if (value === 'serial') return 'integer';
  if (value === 'bigserial') return 'bigint';
  if (value === 'timestamp') return 'timestamp without time zone';
  return value;
}

function readMigrationManifest(drizzleDir: string) {
  const journal = JSON.parse(
    fs.readFileSync(path.join(drizzleDir, 'meta', '_journal.json'), 'utf8')
  ) as { entries: MigrationManifestEntry[] };
  const migrations = readMigrationFiles({ migrationsFolder: drizzleDir });
  return journal.entries.map((entry, index) => ({ ...entry, ...migrations[index] }));
}

function readSnapshot(drizzleDir: string): Record<string, SnapshotTable> {
  const journal = JSON.parse(
    fs.readFileSync(path.join(drizzleDir, 'meta', '_journal.json'), 'utf8')
  ) as { entries: Array<{ idx: number; tag: string }> };
  const latest = journal.entries.at(-1);
  if (!latest) throw new Error('No Drizzle migrations found.');
  const named = path.join(drizzleDir, 'meta', `${latest.tag}_snapshot.json`);
  const indexed = path.join(
    drizzleDir,
    'meta',
    `${String(latest.idx).padStart(4, '0')}_snapshot.json`
  );
  return (
    JSON.parse(fs.readFileSync(fs.existsSync(named) ? named : indexed, 'utf8')) as {
      tables: Record<string, SnapshotTable>;
    }
  ).tables;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export const EXPECTED_PRODUCTION_MIGRATIONS = [
  '0002_dry_blazing_skull',
  '0003_safety_schema_parity',
  '0007_euroleague_advanced_2026',
  '0008_official_schedule_raw_payload',
  '0009_production_season_readiness',
] as const;

export interface ProductionReadinessSnapshot {
  missingTables: string[];
  incompatibleColumns: string[];
  missingUniqueConstraints: string[];
  missingForeignKeys: string[];
  missingIndexes: string[];
  missingMigrations: string[];
  migrationHashMismatches: string[];
  duplicateGroups: string[];
  orphanedForeignKeys: string[];
  tablesWithoutRls: string[];
  unsafeRoleGrants: string[];
}

export interface ProductionReadinessAssessment {
  ready: boolean;
  issues: string[];
}

const ISSUE_LABELS: Array<[keyof ProductionReadinessSnapshot, string]> = [
  ['missingTables', 'missing table'],
  ['incompatibleColumns', 'incompatible column'],
  ['missingUniqueConstraints', 'missing unique constraint'],
  ['missingForeignKeys', 'missing foreign key'],
  ['missingIndexes', 'missing index'],
  ['missingMigrations', 'missing migration'],
  ['migrationHashMismatches', 'migration hash mismatch'],
  ['duplicateGroups', 'duplicate group'],
  ['orphanedForeignKeys', 'orphaned foreign key'],
  ['tablesWithoutRls', 'RLS disabled'],
  ['unsafeRoleGrants', 'unsafe grant'],
];

export function assessProductionReadiness(
  snapshot: ProductionReadinessSnapshot
): ProductionReadinessAssessment {
  const issues = ISSUE_LABELS.flatMap(([key, label]) =>
    snapshot[key].map((value) => `${label}: ${value}`)
  );
  return { ready: issues.length === 0, issues };
}

export function assertProductionRepairAuthorized(env: Record<string, string | undefined>): void {
  if (env.BACKUP_CONFIRMED !== 'true') {
    throw new Error('BACKUP_CONFIRMED=true is required before repairing production schema.');
  }
  if (env.ALLOW_REMOTE_SCHEMA_REPAIR !== 'true') {
    throw new Error(
      'ALLOW_REMOTE_SCHEMA_REPAIR=true is required before repairing a remote database.'
    );
  }
}

export async function inspectProductionReadiness(
  db: DatabaseClient,
  drizzleDir = path.join(process.cwd(), 'drizzle')
): Promise<ProductionReadinessSnapshot> {
  const snapshot: ProductionReadinessSnapshot = {
    missingTables: [],
    incompatibleColumns: [],
    missingUniqueConstraints: [],
    missingForeignKeys: [],
    missingIndexes: [],
    missingMigrations: [],
    migrationHashMismatches: [],
    duplicateGroups: [],
    orphanedForeignKeys: [],
    tablesWithoutRls: [],
    unsafeRoleGrants: [],
  };
  const expectedTables = readSnapshot(drizzleDir);
  const databaseColumns = await db.query<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public'
  `);
  const actualColumns = new Map(
    databaseColumns.rows.map((row) => [`${row.table_name}.${row.column_name}`, row])
  );
  const actualTables = new Set(databaseColumns.rows.map((row) => row.table_name));

  for (const [qualifiedTable, table] of Object.entries(expectedTables)) {
    const tableName = qualifiedTable.replace(/^public\./, '');
    if (!actualTables.has(tableName)) {
      snapshot.missingTables.push(tableName);
      continue;
    }
    for (const column of Object.values(table.columns ?? {})) {
      const key = `${tableName}.${column.name}`;
      const actual = actualColumns.get(key);
      if (!actual) {
        snapshot.incompatibleColumns.push(`${key} missing`);
        continue;
      }
      if (actual.data_type !== normalizeColumnType(column.type)) {
        snapshot.incompatibleColumns.push(
          `${key} type=${actual.data_type} expected=${column.type}`
        );
      }
      const actualNotNull = actual.is_nullable === 'NO';
      if (actualNotNull !== column.notNull) {
        snapshot.incompatibleColumns.push(
          `${key} notNull=${actualNotNull} expected=${column.notNull}`
        );
      }
      if (
        column.default !== undefined &&
        normalizeDefault(actual.column_default) !== normalizeDefault(column.default)
      ) {
        snapshot.incompatibleColumns.push(
          `${key} default=${actual.column_default} expected=${String(column.default)}`
        );
      }
    }
  }
  for (const key of Array.from(actualColumns.keys())) {
    const [tableName, columnName] = key.split('.');
    const table = expectedTables[`public.${tableName}`];
    if (table && !table.columns?.[columnName] && !ALLOWED_LEGACY_COLUMNS.has(key)) {
      snapshot.incompatibleColumns.push(`${key} unexpected`);
    }
  }

  const uniqueRows = await db.query<{
    table_name: string;
    constraint_name: string;
    columns: string;
  }>(`
    SELECT table_class.relname AS table_name,
           constraint_info.conname AS constraint_name,
           string_agg(column_info.attname, ',' ORDER BY key_info.ordinality) AS columns
    FROM pg_constraint constraint_info
    JOIN pg_class table_class ON table_class.oid=constraint_info.conrelid
    CROSS JOIN LATERAL unnest(constraint_info.conkey) WITH ORDINALITY AS key_info(attnum, ordinality)
    JOIN pg_attribute column_info
      ON column_info.attrelid=constraint_info.conrelid AND column_info.attnum=key_info.attnum
    WHERE constraint_info.contype='u'
      AND constraint_info.connamespace='public'::regnamespace
    GROUP BY table_class.relname, constraint_info.conname
  `);
  const uniqueByName = new Map(
    uniqueRows.rows.map((row) => [`${row.table_name}.${row.constraint_name}`, row.columns])
  );
  for (const [table, name, columns] of REQUIRED_UNIQUE_CONSTRAINTS) {
    const key = `${table}.${name}`;
    const actual = uniqueByName.get(key);
    if (!actual) {
      snapshot.missingUniqueConstraints.push(key);
      const quotedColumns = columns.map(quoteIdentifier);
      const nonNull = quotedColumns.map((column) => `${column} IS NOT NULL`).join(' AND ');
      const duplicate = await db.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM (
           SELECT ${quotedColumns.join(', ')} FROM ${quoteIdentifier(table)}
           WHERE ${nonNull}
           GROUP BY ${quotedColumns.join(', ')} HAVING COUNT(*) > 1
         ) duplicate_groups`
      );
      if (duplicate.rows[0]?.count > 0) snapshot.duplicateGroups.push(key);
    } else if (actual !== columns.join(',')) {
      snapshot.incompatibleColumns.push(`${key} columns=${actual} expected=${columns.join(',')}`);
    }
  }

  const foreignKeyRows = await db.query<{
    source_table: string;
    target_table: string;
    source_columns: string;
    target_columns: string;
  }>(`
    SELECT source_table.relname AS source_table,
           target_table.relname AS target_table,
           string_agg(source_column.attname, ',' ORDER BY key_info.ordinality) AS source_columns,
           string_agg(target_column.attname, ',' ORDER BY key_info.ordinality) AS target_columns
    FROM pg_constraint constraint_info
    JOIN pg_class source_table ON source_table.oid=constraint_info.conrelid
    JOIN pg_class target_table ON target_table.oid=constraint_info.confrelid
    CROSS JOIN LATERAL unnest(constraint_info.conkey, constraint_info.confkey)
      WITH ORDINALITY AS key_info(source_attnum, target_attnum, ordinality)
    JOIN pg_attribute source_column
      ON source_column.attrelid=constraint_info.conrelid
      AND source_column.attnum=key_info.source_attnum
    JOIN pg_attribute target_column
      ON target_column.attrelid=constraint_info.confrelid
      AND target_column.attnum=key_info.target_attnum
    WHERE constraint_info.contype='f'
      AND constraint_info.connamespace='public'::regnamespace
    GROUP BY source_table.relname, target_table.relname, constraint_info.conname
  `);
  const foreignKeySignatures = new Set(
    foreignKeyRows.rows.map(
      (row) =>
        `${row.source_table}(${row.source_columns})->${row.target_table}(${row.target_columns})`
    )
  );
  for (const table of Object.values(expectedTables)) {
    for (const foreignKey of Object.values(table.foreignKeys ?? {})) {
      const signature = `${foreignKey.tableFrom}(${foreignKey.columnsFrom.join(',')})->${foreignKey.tableTo}(${foreignKey.columnsTo.join(',')})`;
      if (foreignKeySignatures.has(signature)) continue;
      snapshot.missingForeignKeys.push(`${foreignKey.tableFrom}.${foreignKey.name}`);
      const fromAlias = 'source_row';
      const targetAlias = 'target_row';
      const join = foreignKey.columnsFrom
        .map(
          (column, index) =>
            `${targetAlias}.${quoteIdentifier(foreignKey.columnsTo[index])}=${fromAlias}.${quoteIdentifier(column)}`
        )
        .join(' AND ');
      const populated = foreignKey.columnsFrom
        .map((column) => `${fromAlias}.${quoteIdentifier(column)} IS NOT NULL`)
        .join(' AND ');
      const missingTarget = foreignKey.columnsTo
        .map((column) => `${targetAlias}.${quoteIdentifier(column)} IS NULL`)
        .join(' AND ');
      const orphaned = await db.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM ${quoteIdentifier(foreignKey.tableFrom)} ${fromAlias}
         LEFT JOIN ${quoteIdentifier(foreignKey.tableTo)} ${targetAlias} ON ${join}
         WHERE ${populated} AND ${missingTarget}`
      );
      if (orphaned.rows[0]?.count > 0) {
        snapshot.orphanedForeignKeys.push(`${foreignKey.tableFrom}.${foreignKey.name}`);
      }
    }
  }

  const expectedIndexes = Object.values(expectedTables).flatMap((table) =>
    Object.keys(table.indexes ?? {})
  );
  const indexRows = await db.query<{ indexname: string }>(`
    SELECT indexname FROM pg_indexes WHERE schemaname='public'
  `);
  const indexNames = new Set(indexRows.rows.map((row) => row.indexname));
  snapshot.missingIndexes = expectedIndexes.filter((name) => !indexNames.has(name));

  const manifest = readMigrationManifest(drizzleDir);
  const databaseMigrations = await db.query<{ hash: string; created_at: string }>(`
    SELECT hash, created_at::text FROM drizzle.__drizzle_migrations
  `);
  const migrationsByTimestamp = new Map(
    databaseMigrations.rows.map((row) => [Number(row.created_at), row.hash])
  );
  for (const tag of EXPECTED_PRODUCTION_MIGRATIONS) {
    const migration = manifest.find((entry) => entry.tag === tag);
    if (!migration) throw new Error(`Migration ${tag} is missing from the repository.`);
    const databaseHash = migrationsByTimestamp.get(migration.when);
    if (!databaseHash) snapshot.missingMigrations.push(tag);
    else if (databaseHash !== migration.hash) snapshot.migrationHashMismatches.push(tag);
  }

  const rlsRows = await db.query<{ table_name: string; enabled: boolean }>(
    `
    SELECT relname AS table_name, relrowsecurity AS enabled
    FROM pg_class
    WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])
  `,
    [OFFICIAL_TABLES]
  );
  const rlsByTable = new Map(rlsRows.rows.map((row) => [row.table_name, row.enabled]));
  snapshot.tablesWithoutRls = OFFICIAL_TABLES.filter((table) => !rlsByTable.get(table));

  const grants = await db.query<{ table_name: string; grantee: string; privilege_type: string }>(
    `
    SELECT table_name, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema='public'
      AND table_name=ANY($1::text[])
      AND grantee IN ('anon','authenticated')
  `,
    [OFFICIAL_TABLES]
  );
  snapshot.unsafeRoleGrants = grants.rows.map(
    (row) => `${row.table_name}.${row.grantee}.${row.privilege_type}`
  );
  const sequenceGrants = await db.query<{
    sequence_name: string;
    grantee: string;
    privilege_type: string;
  }>(
    `
      SELECT sequence_info.relname AS sequence_name,
             role_info.rolname AS grantee,
             privilege_info.privilege_type
      FROM pg_class sequence_info
      JOIN pg_namespace namespace_info ON namespace_info.oid=sequence_info.relnamespace
      CROSS JOIN pg_roles role_info
      CROSS JOIN (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS privilege_info(privilege_type)
      WHERE namespace_info.nspname='public'
        AND sequence_info.relkind='S'
        AND sequence_info.relname=ANY($1::text[])
        AND role_info.rolname IN ('anon','authenticated')
        AND has_sequence_privilege(
          role_info.rolname,
          sequence_info.oid,
          privilege_info.privilege_type
        )
    `,
    [OFFICIAL_SEQUENCES]
  );
  snapshot.unsafeRoleGrants.push(
    ...sequenceGrants.rows.map(
      (row) => `sequence.${row.sequence_name}.${row.grantee}.${row.privilege_type}`
    )
  );

  for (const values of Object.values(snapshot)) values.sort();
  return snapshot;
}

export async function applyProductionReadiness(
  pool: Pool,
  drizzleDir = path.join(process.cwd(), 'drizzle')
): Promise<ProductionReadinessSnapshot> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const key of [823744, 823745]) {
      const lock = await client.query<{ acquired: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1) AS acquired',
        [key]
      );
      if (!lock.rows[0]?.acquired) throw new Error('A synchronization is currently running.');
    }

    const before = await inspectProductionReadiness(client, drizzleDir);
    const unsafe = [
      ...before.missingTables,
      ...before.incompatibleColumns,
      ...before.migrationHashMismatches,
      ...before.duplicateGroups,
      ...before.orphanedForeignKeys,
    ];
    if (unsafe.length > 0) {
      throw new Error(`Production schema is not safely repairable: ${unsafe.join('; ')}`);
    }

    const manifest = readMigrationManifest(drizzleDir);
    const repair = manifest.find((entry) => entry.tag === '0009_production_season_readiness');
    if (!repair) throw new Error('Repair migration 0009 is missing.');
    for (const statement of repair.sql) {
      if (statement.trim()) await client.query(statement);
    }

    const recorded = await client.query<{ created_at: string }>(
      'SELECT created_at::text FROM drizzle.__drizzle_migrations'
    );
    const recordedTimestamps = new Set(recorded.rows.map((row) => Number(row.created_at)));
    for (const tag of EXPECTED_PRODUCTION_MIGRATIONS) {
      const migration = manifest.find((entry) => entry.tag === tag);
      if (!migration) throw new Error(`Migration ${tag} is missing from the repository.`);
      if (!recordedTimestamps.has(migration.when)) {
        await client.query(
          'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
          [migration.hash, migration.when]
        );
      }
    }

    const after = await inspectProductionReadiness(client, drizzleDir);
    const assessment = assessProductionReadiness(after);
    if (!assessment.ready) {
      throw new Error(`Repair verification failed: ${assessment.issues.join('; ')}`);
    }
    await client.query('COMMIT');
    return after;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
