import fs from 'node:fs';
import path from 'node:path';
import { getTableColumns, getTableName } from 'drizzle-orm';
import type { Pool } from 'pg';
import * as schema from './schema';

export interface TableShape {
  columns: Set<string>;
  uniqueConstraints: Set<string>;
}

export type SchemaShape = Map<string, TableShape>;

export interface SchemaAuditResult {
  sourceTableCount: number;
  migrationTableCount: number;
  databaseTableCount?: number;
  sourceVsMigration: SchemaDrift;
  sourceVsDatabase?: SchemaDrift;
}

export interface SchemaDrift {
  missingTables: string[];
  extraTables: string[];
  missingColumns: string[];
  extraColumns: string[];
  missingUniqueConstraints: string[];
  extraUniqueConstraints: string[];
}

function emptyTableShape(): TableShape {
  return { columns: new Set(), uniqueConstraints: new Set() };
}

function normalizeTableName(name: string): string {
  return name.replace(/^public\./, '');
}

function getDrizzleSymbol(target: unknown, name: string): symbol | undefined {
  return Object.getOwnPropertySymbols(target as object).find((symbol) => String(symbol) === name);
}

function readSourceUniqueConstraints(tableExport: unknown): Set<string> {
  const constraints = new Set<string>();
  const builderSymbol = getDrizzleSymbol(tableExport, 'Symbol(drizzle:ExtraConfigBuilder)');
  const columnsSymbol = getDrizzleSymbol(tableExport, 'Symbol(drizzle:ExtraConfigColumns)');
  const runtimeColumnsSymbol = getDrizzleSymbol(tableExport, 'Symbol(drizzle:Columns)');
  const builder = builderSymbol ? (tableExport as Record<symbol, unknown>)[builderSymbol] : null;
  const extraColumns = columnsSymbol
    ? (tableExport as Record<symbol, unknown>)[columnsSymbol]
    : undefined;
  const runtimeColumns = runtimeColumnsSymbol
    ? (tableExport as Record<symbol, unknown>)[runtimeColumnsSymbol]
    : undefined;

  for (const column of Object.values(runtimeColumns ?? {})) {
    const { isUnique, uniqueName } = column as { isUnique?: boolean; uniqueName?: string };
    if (isUnique && uniqueName) constraints.add(uniqueName);
  }

  if (typeof builder === 'function') {
    const config = builder(extraColumns) as Record<string, { name?: string }> | unknown[];
    const values = Array.isArray(config) ? config : Object.values(config ?? {});

    for (const item of values) {
      const name = (item as { name?: string }).name;
      if (name) constraints.add(name);
    }
  }

  return constraints;
}

export function readSourceSchema(): SchemaShape {
  const result: SchemaShape = new Map();

  for (const value of Object.values(schema)) {
    try {
      const tableName = getTableName(value as any);
      const columns = getTableColumns(value as any);
      const table = emptyTableShape();

      for (const column of Object.values(columns)) {
        const name = (column as { name?: string }).name;
        if (name) table.columns.add(name);
      }
      readSourceUniqueConstraints(value).forEach((constraint) =>
        table.uniqueConstraints.add(constraint)
      );

      result.set(tableName, table);
    } catch {
      // Ignore non-table exports.
    }
  }

  return result;
}

export function readLatestMigrationSnapshot(
  drizzleDir: string = path.join(process.cwd(), 'drizzle')
): SchemaShape {
  const journalPath = path.join(drizzleDir, 'meta', '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
    entries: { idx: number; tag: string }[];
  };
  const latest = journal.entries.at(-1);

  if (!latest) {
    throw new Error('No Drizzle migration snapshots found');
  }

  const tagSnapshotPath = path.join(drizzleDir, 'meta', `${latest.tag}_snapshot.json`);
  const indexSnapshotPath = path.join(
    drizzleDir,
    'meta',
    `${String(latest.idx).padStart(4, '0')}_snapshot.json`
  );
  const snapshotPath = fs.existsSync(tagSnapshotPath) ? tagSnapshotPath : indexSnapshotPath;
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
    tables: Record<
      string,
      {
        columns?: Record<string, unknown>;
        uniqueConstraints?: Record<string, unknown>;
      }
    >;
  };

  const result: SchemaShape = new Map();
  for (const [rawName, tableInfo] of Object.entries(snapshot.tables)) {
    const table = emptyTableShape();
    Object.keys(tableInfo.columns ?? {}).forEach((column) => table.columns.add(column));
    Object.keys(tableInfo.uniqueConstraints ?? {}).forEach((constraint) =>
      table.uniqueConstraints.add(constraint)
    );
    result.set(normalizeTableName(rawName), table);
  }

  return result;
}

export async function readDatabaseSchema(pool: Pool): Promise<SchemaShape> {
  const tables = await pool.query<{ table_name: string; column_name: string }>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const constraints = await pool.query<{ table_name: string; constraint_name: string }>(`
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'UNIQUE'
    ORDER BY tc.table_name, tc.constraint_name
  `);

  const result: SchemaShape = new Map();

  for (const row of tables.rows) {
    const table = result.get(row.table_name) ?? emptyTableShape();
    table.columns.add(row.column_name);
    result.set(row.table_name, table);
  }

  for (const row of constraints.rows) {
    const table = result.get(row.table_name) ?? emptyTableShape();
    table.uniqueConstraints.add(row.constraint_name);
    result.set(row.table_name, table);
  }

  return result;
}

export function diffSchema(expected: SchemaShape, actual: SchemaShape): SchemaDrift {
  const expectedTables = Array.from(expected.keys()).sort();
  const actualTables = Array.from(actual.keys()).sort();
  const drift: SchemaDrift = {
    missingTables: expectedTables.filter((name) => !actual.has(name)),
    extraTables: actualTables.filter((name) => !expected.has(name)),
    missingColumns: [],
    extraColumns: [],
    missingUniqueConstraints: [],
    extraUniqueConstraints: [],
  };

  for (const tableName of expectedTables) {
    const expectedTable = expected.get(tableName);
    const actualTable = actual.get(tableName);
    if (!expectedTable || !actualTable) continue;

    for (const column of Array.from(expectedTable.columns).sort()) {
      if (!actualTable.columns.has(column)) drift.missingColumns.push(`${tableName}.${column}`);
    }

    for (const column of Array.from(actualTable.columns).sort()) {
      if (!expectedTable.columns.has(column)) drift.extraColumns.push(`${tableName}.${column}`);
    }

    for (const constraint of Array.from(expectedTable.uniqueConstraints).sort()) {
      if (!actualTable.uniqueConstraints.has(constraint)) {
        drift.missingUniqueConstraints.push(`${tableName}.${constraint}`);
      }
    }

    for (const constraint of Array.from(actualTable.uniqueConstraints).sort()) {
      if (!expectedTable.uniqueConstraints.has(constraint)) {
        drift.extraUniqueConstraints.push(`${tableName}.${constraint}`);
      }
    }
  }

  return drift;
}

export function hasDrift(drift: SchemaDrift): boolean {
  return Object.values(drift).some((items) => items.length > 0);
}

export async function auditSchema(pool?: Pool): Promise<SchemaAuditResult> {
  const source = readSourceSchema();
  const migrations = readLatestMigrationSnapshot();
  const result: SchemaAuditResult = {
    sourceTableCount: source.size,
    migrationTableCount: migrations.size,
    sourceVsMigration: diffSchema(source, migrations),
  };

  if (pool) {
    const database = await readDatabaseSchema(pool);
    result.databaseTableCount = database.size;
    result.sourceVsDatabase = diffSchema(source, database);
  }

  return result;
}
