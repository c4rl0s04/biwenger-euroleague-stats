import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createCliPool } from '../../src/lib/db/cli';

export interface RunMigrationsOptions {
  migrationsFolder?: string;
}

/**
 * Runs committed Drizzle migrations against a pg.Pool or Drizzle database instance.
 */
export async function runMigrations(
  poolOrDb: Pool | NodePgDatabase<any>,
  options: RunMigrationsOptions = {}
): Promise<void> {
  const db = 'query' in poolOrDb && 'select' in poolOrDb ? poolOrDb : drizzle(poolOrDb as Pool);
  const migrationsFolder = options.migrationsFolder || path.resolve(process.cwd(), 'drizzle');
  await migrate(db, { migrationsFolder });
}

async function main() {
  dotenv.config({ path: process.env.ENV_LOCAL_FILE || '.env.local' });
  dotenv.config({ path: process.env.ENV_FILE || '.env' });

  console.log('🚀 Running committed Drizzle migrations...');
  const pool = createCliPool();

  try {
    await runMigrations(pool);
    console.log('✅ Migrations applied successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
