interface PoolClientLike {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  release: () => void;
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
  const result = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [lockKey]);
  const locked = result.rows[0]?.locked === true;

  if (!locked) {
    client.release();
    return { acquired: false, release: async () => {} };
  }

  return {
    acquired: true,
    release: async () => {
      try {
        await client.query('SELECT pg_advisory_unlock($1) AS unlocked', [lockKey]);
      } catch (error) {
        console.error(`Failed to release advisory lock for ${label}:`, error);
      } finally {
        client.release();
      }
    },
  };
}
