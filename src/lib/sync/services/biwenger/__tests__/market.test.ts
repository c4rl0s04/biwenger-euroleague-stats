import { describe, expect, it, vi } from 'vitest';
import type { SyncManager } from '../../../manager';
import { resolveMarketDate, syncBiwengerMarket } from '../market';

describe('Biwenger Market Service', () => {
  describe('resolveMarketDate', () => {
    it('shifts date back 1 day when before 05:00 AM', () => {
      const earlyMorning = new Date('2026-03-01T03:30:00Z');
      expect(resolveMarketDate(earlyMorning)).toBe('2026-02-28');
    });

    it('keeps current day when after 05:00 AM', () => {
      const midday = new Date('2026-03-01T14:30:00Z');
      expect(resolveMarketDate(midday)).toBe('2026-03-01');
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
