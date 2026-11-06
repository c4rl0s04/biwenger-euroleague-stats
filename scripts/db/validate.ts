import '../dev/load-env.mjs';
import { createCliPool } from '../../src/lib/db/cli';
import { validateSchemaReady } from '../../src/lib/db/schema-validation';

async function main() {
  console.log('🔍 Validating database schema readiness...');
  const pool = createCliPool();
  try {
    await validateSchemaReady(pool);
    console.log('✅ Database schema is valid and ready for synchronization.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema validation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
