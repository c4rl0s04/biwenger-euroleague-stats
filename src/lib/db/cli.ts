import pg, { Pool, PoolConfig } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  buildPoolConfig,
  isLocalDatabaseTarget,
  type DatabaseEnvironment,
} from './connection-config';
import * as schema from './schema';

export interface CliPoolOptions {
  env?: DatabaseEnvironment;
  max?: number;
  idleTimeoutMillis?: number;
}

/**
 * Creates a standalone pg.Pool for CLI administration scripts using canonical connection-config.
 * Callers are responsible for closing the pool: `await pool.end()`.
 */
export function createCliPool(options: CliPoolOptions = {}): Pool {
  const env = options.env || process.env;
  const poolConfig: PoolConfig = {
    ...buildPoolConfig(env),
    max: options.max ?? 10,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30000,
  };

  return new pg.Pool(poolConfig);
}

/**
 * Creates a Drizzle database instance backed by a standalone CLI pool.
 */
export function createCliDb(poolOrOptions?: Pool | CliPoolOptions): {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
} {
  const pool = poolOrOptions instanceof pg.Pool ? poolOrOptions : createCliPool(poolOrOptions);
  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

export { isLocalDatabaseTarget };
