import { pool } from './client';

export interface DatabaseHealthResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Checks database connectivity with a strict timeout guard.
 * Returns ok status and latency in milliseconds.
 */
export async function checkDatabaseHealth(timeoutMs = 3000): Promise<DatabaseHealthResult> {
  const start = Date.now();
  let timer: NodeJS.Timeout | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Database health check timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    const queryPromise = pool.query('SELECT 1 as alive');

    await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      ok: true,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Database check failed';
    return {
      ok: false,
      latencyMs,
      error: message,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
