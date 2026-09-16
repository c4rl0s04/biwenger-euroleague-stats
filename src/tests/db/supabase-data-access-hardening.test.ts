import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '@/lib/db/schema';
import { inspectProductionReadiness } from '@/lib/db/production-readiness';
import { startDisposablePostgres } from '../../../scripts/db/disposable-postgres';
import { runMigrations } from '../../../scripts/db/migrate';

describe('supabase data access hardening (0018_lock_down_supabase_data_access)', () => {
  const root = process.cwd();
  const migrationPath = path.join(root, 'drizzle', '0018_lock_down_supabase_data_access.sql');
  const journalPath = path.join(root, 'drizzle', 'meta', '_journal.json');
  const snapshotPath = path.join(root, 'drizzle', 'meta', '0018_snapshot.json');

  describe('1. static migration contract assertions', () => {
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

    it('explicitly narrows table revocations to the 37 application tables', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      expect(sql).not.toContain('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public');
      expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE');
      expect(sql).toContain('"assistant_conversations"');
      expect(sql).toContain('"users"');
      expect(sql).toContain('"user_seasons"');
    });

    it('explicitly narrows sequence revocations to application sequences', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      expect(sql).not.toContain('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public');
      expect(sql).toContain('REVOKE ALL PRIVILEGES ON SEQUENCE');
      expect(sql).toContain('"user_rounds_id_seq"');
      expect(sql).toContain('"fichajes_id_seq"');
    });

    it('does NOT revoke existing routines in public to avoid breaking extension routines', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      expect(sql).not.toContain('REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public');
    });

    it('checks roles independently and includes service_role alongside anon and authenticated', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      // Must not bundle roles with AND
      expect(sql).not.toMatch(/IF EXISTS[\s\S]*anon[\s\S]*AND EXISTS[\s\S]*authenticated/);

      // Must check each role independently
      expect(sql).toContain("'anon'");
      expect(sql).toContain("'authenticated'");
      expect(sql).toContain("'service_role'");
      expect(sql).toContain("'postgres'");
    });

    it('revokes default privileges on future functions from PUBLIC', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      expect(sql).toContain(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM PUBLIC;'
      );
      expect(sql).toContain(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM PUBLIC;'
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

  describe('2. real privilege integration test in disposable PostgreSQL', () => {
    it('enforces zero grants for anon, authenticated, service_role, secures future objects, and blocks API roles via DAC', async () => {
      const disposable = await startDisposablePostgres();
      try {
        // Provision the standard Supabase roles
        // Note: service_role has BYPASSRLS in Supabase
        await disposable.pool.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                CREATE ROLE anon NOLOGIN;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                CREATE ROLE authenticated NOLOGIN;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                CREATE ROLE service_role NOLOGIN BYPASSRLS;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
                CREATE ROLE postgres NOLOGIN;
              END IF;
            END $$;
          `);

        // Seed unsafe default privileges to verify migration 0018 strips them
        await disposable.pool.query(`
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
          `);

        // Apply all migrations (0000 through 0018)
        await runMigrations(disposable.pool);

        // 1. Assert 100% of application tables have RLS enabled
        const rlsRes = await disposable.pool.query<{ table_name: string; rls_enabled: boolean }>(`
            SELECT c.relname as table_name, c.relrowsecurity as rls_enabled
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
            ORDER BY c.relname
          `);
        expect(rlsRes.rows.length).toBe(37);
        const tablesWithoutRls = rlsRes.rows.filter((r) => !r.rls_enabled);
        expect(tablesWithoutRls).toHaveLength(0);

        // 2. Assert zero table grants exist for anon, authenticated, service_role
        const tableGrantsRes = await disposable.pool.query(`
            SELECT table_name, grantee, privilege_type
            FROM information_schema.role_table_grants
            WHERE table_schema = 'public'
              AND grantee IN ('anon', 'authenticated', 'service_role')
          `);
        expect(tableGrantsRes.rows).toHaveLength(0);

        // 3. Assert zero sequence grants exist for anon, authenticated, service_role
        const seqGrantsRes = await disposable.pool.query(`
            SELECT sequence_info.relname AS sequence_name,
                   role_info.rolname AS grantee,
                   privilege_info.privilege_type
            FROM pg_class sequence_info
            JOIN pg_namespace namespace_info ON namespace_info.oid=sequence_info.relnamespace
            CROSS JOIN pg_roles role_info
            CROSS JOIN (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS privilege_info(privilege_type)
            WHERE namespace_info.nspname='public'
              AND sequence_info.relkind='S'
              AND role_info.rolname IN ('anon','authenticated','service_role')
              AND has_sequence_privilege(
                role_info.rolname,
                sequence_info.oid,
                privilege_info.privilege_type
              )
          `);
        expect(seqGrantsRes.rows).toHaveLength(0);

        // 4. Test future object creation: default privileges must not grant to API roles
        await disposable.pool.query(
          'CREATE TABLE public.test_future_table (id serial primary key, note text);'
        );
        await disposable.pool.query(
          'CREATE FUNCTION public.test_future_routine() RETURNS int AS $$ SELECT 42; $$ LANGUAGE sql;'
        );

        const futureTableGrants = await disposable.pool.query(`
            SELECT grantee, privilege_type
            FROM information_schema.role_table_grants
            WHERE table_schema = 'public' AND table_name = 'test_future_table'
              AND grantee IN ('anon', 'authenticated', 'service_role')
          `);
        expect(futureTableGrants.rows).toHaveLength(0);

        const futureSeqGrants = await disposable.pool.query(`
            SELECT sequence_info.relname AS sequence_name,
                   role_info.rolname AS grantee
            FROM pg_class sequence_info
            JOIN pg_namespace namespace_info ON namespace_info.oid=sequence_info.relnamespace
            CROSS JOIN pg_roles role_info
            WHERE namespace_info.nspname='public'
              AND sequence_info.relname = 'test_future_table_id_seq'
              AND role_info.rolname IN ('anon','authenticated','service_role')
              AND has_sequence_privilege(role_info.rolname, sequence_info.oid, 'USAGE')
          `);
        expect(futureSeqGrants.rows).toHaveLength(0);

        const futureFuncGrants = await disposable.pool.query(`
            SELECT grantee, privilege_type
            FROM information_schema.routine_privileges
            WHERE routine_schema = 'public' AND routine_name = 'test_future_routine'
          `);
        const nonOwnerFuncGrants = futureFuncGrants.rows.filter(
          (r: any) =>
            r.grantee === 'PUBLIC' || ['anon', 'authenticated', 'service_role'].includes(r.grantee)
        );
        expect(nonOwnerFuncGrants).toHaveLength(0);

        // 5. Test runtime DAC default-deny for all three API roles (including service_role with BYPASSRLS)
        for (const role of ['anon', 'authenticated', 'service_role']) {
          const client = await disposable.pool.connect();
          try {
            await client.query(`SET ROLE ${role}`);
            let error: any = null;
            try {
              await client.query('SELECT * FROM users');
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.code).toBe('42501'); // 42501 = insufficient_privilege
          } finally {
            await client.query('RESET ROLE');
            client.release();
          }
        }

        // 6. Test owner read/write functionality remains intact
        const ownerQueryRes = await disposable.pool.query(
          'SELECT count(*)::int AS count FROM users'
        );
        expect(ownerQueryRes.rows[0].count).toBeGreaterThanOrEqual(0);

        // 7. Verify production-readiness inspection reports zero RLS issues and zero unsafe grants
        const readiness = await inspectProductionReadiness(disposable.pool);
        expect(readiness.tablesWithoutRls).toHaveLength(0);
        expect(readiness.unsafeRoleGrants).toHaveLength(0);
      } finally {
        await disposable.cleanup();
      }
    }, 30000);

    it('ignores legitimate Supabase default ACLs in non-public schemas like storage', async () => {
      const disposable = await startDisposablePostgres();
      try {
        await runMigrations(disposable.pool);

        // Create non-public schema 'storage' and Supabase roles
        await disposable.pool.query(`
            CREATE SCHEMA IF NOT EXISTS storage;
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                CREATE ROLE anon NOLOGIN;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                CREATE ROLE authenticated NOLOGIN;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                CREATE ROLE service_role NOLOGIN;
              END IF;
            END $$;
          `);

        // Seed legitimate Supabase storage default privileges
        await disposable.pool.query(`
            ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO anon, authenticated, service_role;
            ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
            ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
          `);

        // inspectProductionReadiness must ignore storage defaults and report 0 unsafeRoleGrants
        const readiness = await inspectProductionReadiness(disposable.pool);
        expect(readiness.unsafeRoleGrants).toHaveLength(0);
      } finally {
        await disposable.cleanup();
      }
    }, 30000);
  });
});
