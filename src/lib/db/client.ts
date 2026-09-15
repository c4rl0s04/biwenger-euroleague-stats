/**
 * Canonical database access layer.
 *
 * Contract:
 * - pool = raw pg.Pool (or mock pool when CONFIG.DB.SKIP is set)
 * - db   = Drizzle database instance wrapping pool with schema
 */
import pg, { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { CONFIG } from '../config.js';
import { buildPoolConfig } from './connection-config';
import * as schema from './schema';

// Skip database connection in CI/build environment
const skipDb = Boolean(CONFIG?.DB?.SKIP);

export type PgPool =
  | Pool
  | {
      query: () => Promise<{ rows: any[]; rowCount: number }>;
      connect: () => Promise<{ release: () => void }>;
      end: () => Promise<void>;
    };

let rawPool: PgPool;

if (skipDb) {
  // Create a mock database object for builds without a real database
  rawPool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({ release: () => {} }),
    end: async () => {},
  };
} else {
  // Connect to the POSTGRES database
  // Defaults match docker-compose.yml
  const connectionString = process.env.DATABASE_URL;
  const poolConfig: PoolConfig = buildPoolConfig(process.env);

  const realPool = new pg.Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  console.log(`🔌 Database connecting to: ${connectionString ? 'DATABASE_URL' : poolConfig.host}`);

  // Test connection
  realPool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  rawPool = realPool;
}

export const pool: PgPool = rawPool;
export const db = drizzle(rawPool as any, { schema });
