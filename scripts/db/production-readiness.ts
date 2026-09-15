import path from 'node:path';
import * as dotenv from 'dotenv';
import { createCliPool } from '../../src/lib/db/cli';

dotenv.config({ path: process.env.ENV_LOCAL_FILE || '.env.local' });
dotenv.config({ path: process.env.ENV_FILE || '.env' });

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
  const pool = createCliPool();
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
