import { describe, expect, it, vi, beforeEach } from 'vitest';
import { acquireAdvisoryLock } from '../advisory-lock';

describe('acquireAdvisoryLock', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully acquires the lock and releases it via pg_advisory_unlock', async () => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('pg_try_advisory_lock')) {
        return { rows: [{ locked: true }] };
      }
      if (sql.includes('pg_advisory_unlock')) {
        return { rows: [{ unlocked: true }] };
      }
      return { rows: [] };
    });
    const mockRelease = vi.fn();
    const mockClient = { query: mockQuery, release: mockRelease };
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    const lockKey = 823744;
    const lock = await acquireAdvisoryLock(mockPool, lockKey, 'test-sync');

    expect(mockPool.connect).toHaveBeenCalledOnce();
    expect(mockQuery).toHaveBeenCalledWith('SELECT pg_try_advisory_lock($1) AS locked', [lockKey]);
    expect(lock.acquired).toBe(true);
    expect(mockRelease).not.toHaveBeenCalled();

    // Release the lock
    await lock.release();

    expect(mockQuery).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1) AS unlocked', [lockKey]);
    expect(mockRelease).toHaveBeenCalledOnce();
  });

  it('returns acquired: false and immediately releases client when lock is contended', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ locked: false }] });
    const mockRelease = vi.fn();
    const mockClient = { query: mockQuery, release: mockRelease };
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    const lockKey = 823744;
    const lock = await acquireAdvisoryLock(mockPool, lockKey, 'contended-sync');

    expect(mockPool.connect).toHaveBeenCalledOnce();
    expect(lock.acquired).toBe(false);
    expect(mockRelease).toHaveBeenCalledOnce();

    // Releasing an unacquired lock should be safe and idempotent
    await lock.release();
    expect(mockRelease).toHaveBeenCalledOnce(); // Still 1, not called again
  });

  it('handles unlock query errors gracefully and ensures client is released', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('pg_try_advisory_lock')) {
        return { rows: [{ locked: true }] };
      }
      if (sql.includes('pg_advisory_unlock')) {
        throw new Error('Database connection severed');
      }
      return { rows: [] };
    });
    const mockRelease = vi.fn();
    const mockClient = { query: mockQuery, release: mockRelease };
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    const lock = await acquireAdvisoryLock(mockPool, 823744, 'error-test');
    expect(lock.acquired).toBe(true);

    // Should not rethrow the error
    await expect(lock.release()).resolves.toBeUndefined();

    expect(mockRelease).toHaveBeenCalledWith(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to release advisory lock for error-test:',
      expect.any(Error)
    );
    expect(mockRelease).toHaveBeenCalledOnce();
  });

  it('gracefully handles pool without connect method (mock / test environments)', async () => {
    const mockPool = {};
    const lock = await acquireAdvisoryLock(mockPool, 823744, 'no-connect');

    expect(lock.acquired).toBe(true);
    await expect(lock.release()).resolves.toBeUndefined();
  });

  it('gracefully handles client without query method and releases client', async () => {
    const mockRelease = vi.fn();
    const mockClient = { release: mockRelease };
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    const lock = await acquireAdvisoryLock(mockPool, 823744, 'no-query');

    expect(lock.acquired).toBe(true);
    expect(mockRelease).toHaveBeenCalledOnce();
    await expect(lock.release()).resolves.toBeUndefined();
  });
  it('destroys a client when acquisition fails with uncertain lock state', async () => {
    const failure = new Error('acquisition failed');
    const client = { query: vi.fn().mockRejectedValue(failure), release: vi.fn() };
    await expect(
      acquireAdvisoryLock({ connect: async () => client }, 823744, 'failure')
    ).rejects.toBe(failure);
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('propagates connection failure without granting a lock', async () => {
    const failure = new Error('connection failed');
    await expect(
      acquireAdvisoryLock({ connect: vi.fn().mockRejectedValue(failure) }, 823744, 'failure')
    ).rejects.toBe(failure);
  });

  it('releases an acquired session only once, including concurrent cleanup calls', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ locked: true }] }),
      release: vi.fn(),
    };
    const lock = await acquireAdvisoryLock({ connect: async () => client }, 823744, 'once');
    await Promise.all([lock.release(), lock.release()]);
    expect(client.query).toHaveBeenCalledTimes(2);
    expect(client.release).toHaveBeenCalledExactlyOnceWith();
  });
});
