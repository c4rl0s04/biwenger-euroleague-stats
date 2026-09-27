interface PoolClientLike {
  query?: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  release: (destroy?: boolean) => void;
}

interface PoolLike {
  connect?: () => Promise<PoolClientLike>;
}

export interface AdvisoryLock {
  acquired: boolean;
  release: () => Promise<void>;
}

export async function acquireAdvisoryLock(
  pool: PoolLike,
  lockKey: number,
  label: string
): Promise<AdvisoryLock> {
  if (typeof pool.connect !== 'function') {
    return { acquired: true, release: async () => {} };
  }

  const client = await pool.connect();
  if (typeof client.query !== 'function') {
    client.release();
    return { acquired: true, release: async () => {} };
  }

  let result;
  try {
    result = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [lockKey]);
  } catch (error) {
    // A failed response does not prove the server did not acquire the session lock.
    client.release(true);
    throw error;
  }
  const locked = result.rows[0]?.locked === true;

  if (!locked) {
    client.release();
    return { acquired: false, release: async () => {} };
  }

  let released = false;
  return {
    acquired: true,
    release: async () => {
      if (released) return;
      released = true;
      let destroy = false;
      try {
        if (typeof client.query === 'function') {
          await client.query('SELECT pg_advisory_unlock($1) AS unlocked', [lockKey]);
        }
      } catch (error) {
        destroy = true;
        console.error(`Failed to release advisory lock for ${label}:`, error);
      } finally {
        // Never reuse a connection whose session lock may still be held.
        if (destroy) client.release(true);
        else client.release();
      }
    },
  };
}
