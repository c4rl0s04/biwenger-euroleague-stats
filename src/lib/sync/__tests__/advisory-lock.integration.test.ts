import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  startDisposablePostgres,
  type DisposablePostgres,
} from '../../../../scripts/db/disposable-postgres';
import { acquireAdvisoryLock } from '../advisory-lock';

// Creates a new loopback cluster; never reads application database credentials.
describe.skipIf(process.env.RUN_SYNC_LOCK_DB_TESTS !== 'true')(
  'sync lock PostgreSQL sessions',
  () => {
    let local: DisposablePostgres;
    beforeAll(async () => {
      local = await startDisposablePostgres();
    }, 120000);
    afterAll(async () => {
      await local?.cleanup();
    });

    it('excludes another session until the owner releases its lock', async () => {
      const first = await acquireAdvisoryLock(local.pool, 823744, 'first');
      expect(first.acquired).toBe(true);
      try {
        const second = await acquireAdvisoryLock(local.pool, 823744, 'second');
        expect(second.acquired).toBe(false);
        await second.release();
      } finally {
        await first.release();
      }
      const retry = await acquireAdvisoryLock(local.pool, 823744, 'retry');
      try {
        expect(retry.acquired).toBe(true);
      } finally {
        await retry.release();
      }
    });

    it('destroys the locked session when unlocking fails so a later worker can acquire it', async () => {
      const lock = await acquireAdvisoryLock(
        {
          connect: async () => {
            const client = await local.pool.connect();
            return {
              query: async (sql: string, params?: unknown[]) => {
                if (sql.includes('pg_advisory_unlock')) throw new Error('synthetic unlock failure');
                return client.query(sql, params);
              },
              release: (destroy?: boolean) => client.release(destroy),
            };
          },
        },
        823744,
        'broken-unlock'
      );
      expect(lock.acquired).toBe(true);
      await lock.release();
      // PostgreSQL processes the closed socket asynchronously.
      await expect
        .poll(async () => {
          const retry = await acquireAdvisoryLock(local.pool, 823744, 'retry');
          await retry.release();
          return retry.acquired;
        })
        .toBe(true);
    });
  }
);
