import path from 'node:path';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: process.env.ENV_LOCAL_FILE || '.env.local' });
dotenv.config({ path: process.env.ENV_FILE || '.env' });

function createPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    const local = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    return new pg.Pool({ connectionString, ssl: local ? false : { rejectUnauthorized: false } });
  }
  return new pg.Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB,
  });
}

async function main() {
  const mode = process.argv[2] || 'check';
  if (!['check', 'apply'].includes(mode)) {
    throw new Error('Usage: production-readiness.ts <check|apply>');
  }
  const {
    applyProductionReadiness,
    assessProductionReadiness,
    assertProductionRepairAuthorized,
    inspectProductionReadiness,
  } = await import('../../src/lib/db/production-readiness');
  const pool = createPool();
  try {
    const drizzleDir = path.join(process.cwd(), 'drizzle');
    if (mode === 'apply') {
      assertProductionRepairAuthorized(process.env);
      await applyProductionReadiness(pool, drizzleDir);
    }
    const snapshot = await inspectProductionReadiness(pool, drizzleDir);
    const assessment = assessProductionReadiness(snapshot);
    console.log(JSON.stringify({ mode, ...assessment, snapshot }, null, 2));
    if (!assessment.ready) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
