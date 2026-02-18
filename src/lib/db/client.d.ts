
import { Pool } from 'pg';

/**
 * Shared Postgres Pool instance.
 * Can be a real pg.Pool or a mock object if DB connection is skipped.
 */
export const db: Pool;
