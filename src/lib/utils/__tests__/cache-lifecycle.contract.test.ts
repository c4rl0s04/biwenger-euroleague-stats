import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cached,
  clearCache,
  clearCacheByPrefix,
  getCacheStats,
  CACHE_TTL,
} from '@/lib/utils/cache';

describe('Cache Lifecycle & Key Invariant Contract', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('key convention and domain prefix isolation', () => {
    it('isolates cache entries by domain prefix when selectively invalidating', async () => {
      const standingsFactory = vi.fn(async () => ({ table: 'standings-data' }));
      const marketFactory = vi.fn(async () => ({ market: 'active-listings' }));
      const advancedFactory = vi.fn(async () => ({ stats: 'advanced-metrics' }));

      // Populate multiple domains
      await cached('standings:league-table', CACHE_TTL.LONG, standingsFactory);
      await cached('standings:history', CACHE_TTL.LONG, standingsFactory);
      await cached('market:kpis', CACHE_TTL.SHORT, marketFactory);
      await cached('advanced:metrics', CACHE_TTL.MEDIUM, advancedFactory);

      expect(getCacheStats().size).toBe(4);
      expect(getCacheStats().keys).toEqual(
        expect.arrayContaining([
          'standings:league-table',
          'standings:history',
          'market:kpis',
          'advanced:metrics',
        ])
      );

      // Invalidate only standings
      clearCacheByPrefix('standings:');

      const statsAfterStandingsClear = getCacheStats();
      expect(statsAfterStandingsClear.size).toBe(2);
      expect(statsAfterStandingsClear.keys).toEqual(
        expect.arrayContaining(['market:kpis', 'advanced:metrics'])
      );

      // Re-querying standings calls the factory again
      await cached('standings:league-table', CACHE_TTL.LONG, standingsFactory);
      expect(standingsFactory).toHaveBeenCalledTimes(3); // 2 initial + 1 after clear

      // Re-querying market and advanced uses the cache (factory not called again)
      await cached('market:kpis', CACHE_TTL.SHORT, marketFactory);
      await cached('advanced:metrics', CACHE_TTL.MEDIUM, advancedFactory);
      expect(marketFactory).toHaveBeenCalledTimes(1);
      expect(advancedFactory).toHaveBeenCalledTimes(1);
    });
  });

  describe('season partitioning and isolation', () => {
    it('strictly isolates data between different seasons under the same domain', async () => {
      const season24Factory = vi.fn(async () => ({ seasonId: '2024-25', champion: 'Team A' }));
      const season25Factory = vi.fn(async () => ({ seasonId: '2025-26', champion: 'Team B' }));

      const res24 = await cached(
        'season-review:summary:2024-25',
        CACHE_TTL.VERY_LONG,
        season24Factory
      );
      const res25 = await cached(
        'season-review:summary:2025-26',
        CACHE_TTL.VERY_LONG,
        season25Factory
      );

      expect(res24.seasonId).toBe('2024-25');
      expect(res25.seasonId).toBe('2025-26');
      expect(res24.champion).toBe('Team A');
      expect(res25.champion).toBe('Team B');

      // Clear only season 2024-25 entries
      clearCacheByPrefix('season-review:summary:2024-25');

      expect(getCacheStats().keys).toEqual(['season-review:summary:2025-26']);

      // 2025-26 remains cached
      await cached('season-review:summary:2025-26', CACHE_TTL.VERY_LONG, season25Factory);
      expect(season25Factory).toHaveBeenCalledTimes(1);

      // 2024-25 triggers factory
      await cached('season-review:summary:2024-25', CACHE_TTL.VERY_LONG, season24Factory);
      expect(season24Factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('global cache eviction', () => {
    it('clearCache() purges all domain and season-scoped entries unconditionally', async () => {
      const domains = [
        'standings:2024-25',
        'standings:2025-26',
        'market:listings',
        'advanced:heatmap:2025-26',
        'overview:dashboard',
        'schedule:round:10',
      ];

      for (const key of domains) {
        await cached(key, CACHE_TTL.MEDIUM, async () => ({ key }));
      }

      expect(getCacheStats().size).toBe(6);

      clearCache();

      expect(getCacheStats().size).toBe(0);
      expect(getCacheStats().keys).toEqual([]);
    });
  });

  describe('completed cache hit behavior', () => {
    it('reuses a completed result for sequential requests', async () => {
      let callCount = 0;
      const slowFactory = async () => {
        callCount++;
        return { data: 42, count: callCount };
      };

      const first = await cached('test:concurrency', CACHE_TTL.SHORT, slowFactory);
      const second = await cached('test:concurrency', CACHE_TTL.SHORT, slowFactory);

      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });
  });
});
