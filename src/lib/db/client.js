/**
 * Database access layer using pg (PostgreSQL)
 */
import pg from 'pg';
const { Pool } = pg;

import { CONFIG } from '../config.js';

// Skip database connection in CI/build environment
const skipDb = CONFIG.DB.SKIP;

let db;

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
  const isProduction = process.env.NODE_ENV === 'production';
  const isRemote = process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== 'localhost';

  const pool = new Pool({
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'biwenger',
    max: 10,
    idleTimeoutMillis: 30000,
    // Enable SSL for remote connections (Supabase requires it)
    ssl:
      isProduction || isRemote
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  // Test connection
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  db = pool;
}

export { db };
