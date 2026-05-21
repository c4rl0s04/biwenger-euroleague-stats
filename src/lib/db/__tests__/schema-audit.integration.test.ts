import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { auditSchema, hasDrift } from '../schema-audit';

function assertSafeIntegrationDatabase(url: string | undefined) {
  if (!url) throw new Error('DATABASE_URL is required when RUN_DB_TESTS=true');
  const looksLocal = url.includes('localhost') || url.includes('127.0.0.1');
  if (!looksLocal && process.env.ALLOW_REMOTE_TEST_DB !== 'true') {
    throw new Error('Refusing to run DB integration tests against a non-local DATABASE_URL');
  }
}

const runDbTests = process.env.RUN_DB_TESTS === 'true';
const dbDescribe = runDbTests ? describe : describe.skip;

dbDescribe('schema audit integration', () => {
  it('checks a disposable database without mutating it', async () => {
    assertSafeIntegrationDatabase(process.env.DATABASE_URL);

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const result = await auditSchema(pool);
      expect(hasDrift(result.sourceVsMigration)).toBe(false);
      expect(result.sourceVsDatabase).toBeDefined();
    } finally {
      await pool.end();
    }
  });
});
