/**
 * Database access layer using pg (PostgreSQL)
 */
import pg, { Pool, PoolConfig } from 'pg';

import { CONFIG } from '../config.js';
import { buildPoolConfig } from './connection-config';

// Skip database connection in CI/build environment
const skipDb = CONFIG.DB.SKIP;

// Use a union type to allow for the mock DB object
let db:
  | Pool
  | {
      query: () => Promise<{ rows: any[]; rowCount: number }>;
      connect: () => Promise<{ release: () => void }>;
      end: () => Promise<void>;
    };

if (skipDb) {
  // Create a mock database object for builds without a real database
  db = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({ release: () => {} }),
    end: async () => {},
  };
} else {
  // Connect to the POSTGRES database
  // Defaults match docker-compose.yml
  const connectionString = process.env.DATABASE_URL;
  const poolConfig: PoolConfig = buildPoolConfig(process.env);

  const pool = new pg.Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  console.log(`🔌 Database connecting to: ${connectionString ? 'DATABASE_URL' : poolConfig.host}`);

  // Test connection
  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  db = pool;
}

export { db };
