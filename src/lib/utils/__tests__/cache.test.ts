import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cached, clearCache, clearCacheByPrefix, CACHE_TTL } from '@/lib/utils/cache';

describe('CACHE_TTL constants', () => {
  it('has correct SHORT value (60s)', () => {
    expect(CACHE_TTL.SHORT).toBe(60);
  });

  it('has correct MEDIUM value (5 min)', () => {
    expect(CACHE_TTL.MEDIUM).toBe(300);
  });

  it('has correct LONG value (15 min)', () => {
    expect(CACHE_TTL.LONG).toBe(900);
  });

  it('has correct VERY_LONG value (1 hour)', () => {
    expect(CACHE_TTL.VERY_LONG).toBe(3600);
  });
});

describe('cached()', () => {
  beforeEach(() => {
    clearCache();
  });

  it('calls the factory function on first access (cache miss)', async () => {
    const factory = vi.fn().mockResolvedValue('hello');
    const result = await cached('test-key', 60, factory);
    expect(factory).toHaveBeenCalledOnce();
    expect(result).toBe('hello');
  });

  it('returns cached value on second call without re-running factory', async () => {
    const factory = vi.fn().mockResolvedValue('world');
    await cached('test-key-2', 60, factory);
    const second = await cached('test-key-2', 60, factory);
    expect(factory).toHaveBeenCalledOnce();
    expect(second).toBe('world');
  });

  it('uses separate cache entries for different keys', async () => {
    const f1 = vi.fn().mockResolvedValue('a');
    const f2 = vi.fn().mockResolvedValue('b');
    const r1 = await cached('key-a', 60, f1);
    const r2 = await cached('key-b', 60, f2);
    expect(r1).toBe('a');
    expect(r2).toBe('b');
    expect(f1).toHaveBeenCalledOnce();
    expect(f2).toHaveBeenCalledOnce();
  });

  it('re-fetches after TTL expires', async () => {
    vi.useFakeTimers();
    const factory = vi.fn().mockResolvedValue('fresh');
    await cached('ttl-key', 1, factory); // 1 second TTL
    vi.advanceTimersByTime(2000); // 2 seconds later
    await cached('ttl-key', 1, factory);
    expect(factory).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('clearCache()', () => {
  it('clears all cached entries', async () => {
    const factory = vi.fn().mockResolvedValue('data');
    await cached('clear-key', 60, factory);
    clearCache();
    await cached('clear-key', 60, factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('clearCacheByPrefix()', () => {
  beforeEach(() => {
    clearCache();
  });

  it('clears only entries matching the prefix', async () => {
    const f1 = vi.fn().mockResolvedValue('standings');
    const f2 = vi.fn().mockResolvedValue('market');
    await cached('standings:full', 60, f1);
    await cached('market:kpis', 60, f2);

    clearCacheByPrefix('standings:');

    // standings should be re-fetched
    await cached('standings:full', 60, f1);
    expect(f1).toHaveBeenCalledTimes(2);

    // market should still be cached
    await cached('market:kpis', 60, f2);
    expect(f2).toHaveBeenCalledOnce();
  });
});
