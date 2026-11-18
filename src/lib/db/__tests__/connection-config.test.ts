import { describe, expect, it } from 'vitest';
import { buildPoolConfig, isLocalDatabaseTarget } from '../connection-config';
import { supabaseRootCA } from '../supabase-ca';

describe('database connection configuration', () => {
  it('lets a local DATABASE_URL override unrelated remote POSTGRES_HOST variables', () => {
    expect(
      buildPoolConfig({
        DATABASE_URL: 'postgresql://user@127.0.0.1:55432/biwenger_disposable',
        POSTGRES_HOST: 'production.example.com',
      })
    ).toMatchObject({
      user: 'user',
      host: '127.0.0.1',
      port: 55432,
      database: 'biwenger_disposable',
      ssl: false,
    });
  });

  it.each([
    '',
    '?ssl=0',
    '?ssl=no-verify',
    '?sslmode=disable',
    '?sslmode=no-verify',
    '?sslmode=require&uselibpqcompat=true',
  ])('requires verified TLS for remote URLs even with options %s', (options) => {
    const config = buildPoolConfig({
      DATABASE_URL: 'postgresql://user:secret%40example@example.com:5432/app' + options,
    });
    expect(config).toMatchObject({ password: 'secret@example', ssl: { rejectUnauthorized: true } });
    expect(config.connectionString).toBeUndefined();
    expect(config.ssl).not.toHaveProperty('checkServerIdentity');
  });

  it('uses the effective host when the URL host is overridden', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost/app?host=remote.example.com&sslmode=disable',
    };
    expect(isLocalDatabaseTarget(env)).toBe(false);
    expect(buildPoolConfig(env)).toMatchObject({
      host: 'remote.example.com',
      ssl: { rejectUnauthorized: true },
    });
  });

  it('requires TLS when the default pg host is remote', () => {
    const env = { PGHOST: 'remote.example.com' };
    expect(isLocalDatabaseTarget(env)).toBe(false);
    expect(buildPoolConfig(env)).toMatchObject({
      host: 'remote.example.com',
      ssl: { rejectUnauthorized: true },
    });
  });

  it('rejects an invalid DSN instead of treating it as a local target', () => {
    const env = { DATABASE_URL: 'not-a-postgres-url' };
    expect(isLocalDatabaseTarget(env)).toBe(false);
    expect(() => buildPoolConfig(env)).toThrow('Invalid PostgreSQL connection string');
  });

  it('trusts the Supabase CA on split pooler settings and direct URLs', () => {
    const ssl = { rejectUnauthorized: true, ca: supabaseRootCA };
    expect(buildPoolConfig({ POSTGRES_HOST: 'aws-0-eu-west-1.pooler.supabase.com' })).toMatchObject(
      { ssl }
    );
    expect(
      buildPoolConfig({ POSTGRES_URL: 'postgres://db.project.supabase.co/postgres' })
    ).toMatchObject({ ssl });
    expect(
      buildPoolConfig({ POSTGRES_HOST: 'pooler.supabase.com.example.com' }).ssl
    ).not.toHaveProperty('ca', supabaseRootCA);
  });

  it('falls back to discrete local POSTGRES variables when DATABASE_URL is absent', () => {
    expect(
      buildPoolConfig({
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '55432',
        POSTGRES_USER: 'user',
        POSTGRES_PASSWORD: 'secret',
        POSTGRES_DB: 'app',
      })
    ).toEqual({
      host: 'localhost',
      port: 55432,
      user: 'user',
      password: 'secret',
      database: 'app',
      ssl: false,
    });
  });
});
