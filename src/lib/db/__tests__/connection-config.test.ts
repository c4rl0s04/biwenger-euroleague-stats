import { describe, expect, it } from 'vitest';
import { buildPoolConfig } from '../connection-config';

describe('database connection configuration', () => {
  it('lets a local DATABASE_URL override unrelated remote POSTGRES_HOST variables', () => {
    expect(
      buildPoolConfig({
        DATABASE_URL: 'postgresql://user@127.0.0.1:55432/biwenger_disposable',
        POSTGRES_HOST: 'production.example.com',
      })
    ).toEqual({
      connectionString: 'postgresql://user@127.0.0.1:55432/biwenger_disposable',
      ssl: false,
    });
  });

  it('enables compatibility SSL for a remote DATABASE_URL', () => {
    expect(
      buildPoolConfig({ DATABASE_URL: 'postgresql://user@example.com:5432/app' })
    ).toMatchObject({ ssl: { rejectUnauthorized: false } });
  });

  it('falls back to discrete POSTGRES variables when DATABASE_URL is absent', () => {
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
