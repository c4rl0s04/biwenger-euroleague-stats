import { describe, expect, it } from 'vitest';
import { createCliPool, createCliDb, isLocalDatabaseTarget } from '../cli';

describe('CLI database connection helpers', () => {
  it('correctly detects local database targets', () => {
    expect(
      isLocalDatabaseTarget({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      })
    ).toBe(true);

    expect(
      isLocalDatabaseTarget({
        DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/test',
      })
    ).toBe(true);

    expect(
      isLocalDatabaseTarget({
        DATABASE_URL: 'postgresql://postgres:postgres@postgres:5432/test',
      })
    ).toBe(true);

    expect(
      isLocalDatabaseTarget({
        DATABASE_URL:
          'postgresql://postgres:postgres@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
      })
    ).toBe(false);
  });

  it('instantiates a CLI pool with buildPoolConfig options', () => {
    const pool = createCliPool({
      env: {
        DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/test',
      },
      max: 5,
    });

    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
    expect(typeof pool.end).toBe('function');
  });

  it('instantiates a CLI Drizzle instance backed by a pool', () => {
    const pool = createCliPool({
      env: {
        DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/test',
      },
    });

    const { db, pool: returnedPool } = createCliDb(pool);
    expect(returnedPool).toBe(pool);
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
  });
});
