import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '@/lib/db/schema';

describe('supabase data access hardening (0018_lock_down_supabase_data_access)', () => {
  const root = process.cwd();
  const migrationPath = path.join(root, 'drizzle', '0018_lock_down_supabase_data_access.sql');
  const journalPath = path.join(root, 'drizzle', 'meta', '_journal.json');
  const snapshotPath = path.join(root, 'drizzle', 'meta', '0018_snapshot.json');

  it('migration 0018 file exists and contains valid, non-empty SQL', () => {
    const sql = readFileSync(migrationPath, 'utf8');
    expect(sql.length).toBeGreaterThan(0);
  });

  it('migration 0018 is purely additive and does not drop tables or columns', () => {
    const sql = readFileSync(migrationPath, 'utf8');
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
  });

  it('enables Row Level Security on every table in the application schema', () => {
    const sql = readFileSync(migrationPath, 'utf8');
    const schemaTables: string[] = [];

    for (const exportVal of Object.values(schema)) {
      try {
        const config = getTableConfig(exportVal as any);
        if (config?.name) {
          schemaTables.push(config.name);
        }
      } catch {
        // Not a table
      }
    }

    expect(schemaTables.length).toBe(37);

    for (const tableName of schemaTables) {
      const statement = `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`;
      expect(sql).toContain(statement);
    }
  });

  it('revokes all existing table, sequence, and routine privileges from PUBLIC, anon, and authenticated', () => {
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC;');
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;');
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;');

    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;'
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;'
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;'
    );
  });

  it('revokes default privileges in schema public for future tables, sequences, and routines', () => {
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;'
    );
    expect(sql).toContain(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;'
    );
    expect(sql).toContain(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;'
    );
  });

  it('records migration 0018 in the Drizzle migration journal and includes a matching snapshot', () => {
    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ idx: number; tag: string }>;
    };
    const entry18 = journal.entries.find((e) => e.idx === 18);

    expect(entry18).toBeDefined();
    expect(entry18?.tag).toBe('0018_lock_down_supabase_data_access');

    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as {
      version: string;
      tables: Record<string, unknown>;
    };
    expect(Object.keys(snapshot.tables)).toHaveLength(37);
  });
});
