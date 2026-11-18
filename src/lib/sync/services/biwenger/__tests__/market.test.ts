import { describe, expect, it, vi } from 'vitest';
import type { SyncManager } from '../../../manager';
import { resolveMarketDate, syncBiwengerMarket } from '../market';

describe('Biwenger Market Service', () => {
  describe('resolveMarketDate', () => {
    it.each([
      ['winter: 04:59 Madrid', '2026-11-17T03:59:59Z', '2026-11-16'],
      ['winter: 05:00 Madrid', '2026-11-17T04:00:00Z', '2026-11-17'],
      ['summer: 04:59 Madrid', '2026-07-01T02:59:59Z', '2026-06-30'],
      ['summer: 05:00 Madrid', '2026-07-01T03:00:00Z', '2026-07-01'],
      ['spring clock change: 05:00 Madrid', '2026-03-29T03:00:00Z', '2026-03-29'],
      ['autumn clock change: 04:59 Madrid', '2026-10-25T03:59:59Z', '2026-10-24'],
      ['New Year: midnight Madrid', '2026-12-31T23:00:00Z', '2026-12-31'],
    ])('returns the market date at %s', (_case, instant, expected) => {
      expect(resolveMarketDate(new Date(instant))).toBe(expected);
    });
  });

  describe('syncBiwengerMarket', () => {
    const query = vi.fn();
    const manager = {
      context: { db: { query }, seasonId: '2025-26' },
      log: vi.fn(),
    } as unknown as SyncManager;

    it.each([
      { success: true, status: 200, raw: 'unexpected success body' },
      { data: {} },
      { data: { sales: null } },
      {
        data: {
          sales: [
            { player: 101, price: 100 },
            { player: null, price: 200 },
          ],
        },
      },
      { data: { sales: [{ player: 101 }] } },
    ])('rejects an invalid snapshot before any database call', async (payload) => {
      query.mockClear();

      await expect(
        syncBiwengerMarket(manager, { fetchMarketListings: async () => payload })
      ).rejects.toThrow('Invalid Biwenger market snapshot');
      expect(query).not.toHaveBeenCalled();
    });
    it('handles empty market listings', async () => {
      query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });

      const mockFetch = vi.fn().mockResolvedValue({
        data: { sales: [] },
      });

      const result = await syncBiwengerMarket(manager, {
        fetchMarketListings: mockFetch,
      });

      expect(result.counts.listings).toBe(0);
      expect(result.counts.skipped).toBe(0);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM market_listings'), [
        '2025-26',
        expect.any(String),
        '[]',
      ]);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('upserts active market listings and deletes stale ones', async () => {
      query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });

      const mockFetch = vi.fn().mockResolvedValue({
        data: {
          sales: [
            { player: { id: 101 }, price: 2000000, user: { id: 'user-1' } },
            { player: 102, price: 1500000, user: null },
            { player: 101, value: 500000, user: { id: 'user-2' } },
          ],
        },
      });

      const result = await syncBiwengerMarket(manager, {
        fetchMarketListings: mockFetch,
      });

      expect(result.counts.listings).toBe(2);
      expect(result.counts.skipped).toBe(0);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO market_listings'),
        expect.any(Array)
      );
    });
  });
});
