import 'dotenv/config';
import { db } from '../../src/lib/db/client';
import { validateSchemaReady } from '../../src/lib/db/schema_init';

async function main() {
  console.log('🔍 Validating database schema readiness...');
  try {
    await validateSchemaReady(db as any);
    console.log('✅ Database schema is valid and ready for synchronization.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema validation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (db && typeof (db as any).end === 'function') {
      await (db as any).end();
    }
  }
}

void main();
