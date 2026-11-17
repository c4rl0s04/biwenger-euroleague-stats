import { describe, expect, it } from 'vitest';
import { buildPoolConfig, databaseUrl, isLocalDatabaseTarget } from '../connection-config';

describe('database connection configuration', () => {
  it('uses one URL and ignores legacy split settings', () => {
    expect(
      buildPoolConfig({
        DATABASE_URL: 'postgresql://user@127.0.0.1:55432/app',
        POSTGRES_HOST: 'elsewhere',
      })
    ).toEqual({ connectionString: 'postgresql://user@127.0.0.1:55432/app', ssl: false });
  });
  it('preserves remote TLS behavior', () => {
    expect(buildPoolConfig({ DATABASE_URL: 'postgres://user@example.com/app' })).toMatchObject({
      ssl: { rejectUnauthorized: false },
    });
    expect(isLocalDatabaseTarget({ DATABASE_URL: 'postgres://user@example.com/app' })).toBe(false);
  });
  it.each(['localhost', '127.0.0.1', '[::1]', 'postgres'])('recognizes local host %s', (host) => {
    expect(isLocalDatabaseTarget({ DATABASE_URL: `postgres://user@${host}/app` })).toBe(true);
  });
  it.each([
    undefined,
    '',
    'https://example.com/app',
    'postgres://',
    'postgres://user@localhost',
    'not a URL',
    'postgres://fixture:%ZZ@localhost/app',
  ])('rejects missing or invalid input without echoing it', (value) => {
    expect(() => databaseUrl({ DATABASE_URL: value })).toThrow(/DATABASE_URL/);
    if (value) {
      try {
        databaseUrl({ DATABASE_URL: value });
      } catch (error) {
        expect((error as Error).message).not.toContain(value);
      }
    }
  });
  it('does not accept aliases as configuration', () => {
    expect(() =>
      buildPoolConfig({ POSTGRES_URL: 'postgres://localhost/app', POSTGRES_HOST: 'localhost' })
    ).toThrow('DATABASE_URL is required');
  });
});
