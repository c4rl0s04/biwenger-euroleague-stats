import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkDatabaseHealth } from './health';
import { pool } from './client';

vi.mock('./client', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('checkDatabaseHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok: true with latency on successful query', async () => {
    vi.mocked(pool.query as any).mockResolvedValueOnce({ rows: [{ alive: 1 }], rowCount: 1 });

    const result = await checkDatabaseHealth(1000);

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith('SELECT 1 as alive');
  });

  it('returns ok: false with error message when query rejects', async () => {
    vi.mocked(pool.query as any).mockRejectedValueOnce(new Error('Connection refused'));

    const result = await checkDatabaseHealth(1000);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Connection refused');
  });

  it('returns ok: false when query times out', async () => {
    vi.mocked(pool.query as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    const result = await checkDatabaseHealth(50);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('timed out after 50ms');
  });
});
