import { describe, expect, it, vi } from 'vitest';
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
    it('handles empty market listings', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      };

      const manager: any = {
        context: { db: mockDb, seasonId: '2025-26' },
        log: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        data: { sales: [] },
      });

      const result = await syncBiwengerMarket(manager, {
        fetchMarketListings: mockFetch,
      });

      expect(result.counts.listings).toBe(0);
      expect(result.counts.skipped).toBe(0);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM market_listings'),
        expect.any(Array)
      );
    });

    it('upserts active market listings and deletes stale ones', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      };

      const manager: any = {
        context: { db: mockDb, seasonId: '2025-26' },
        log: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        data: {
          sales: [
            { player: { id: 101 }, price: 2000000, user: { id: 'user-1' } },
            { player: 102, price: 1500000, user: null },
            { player: null, price: 500000 }, // invalid player
          ],
        },
      });

      const result = await syncBiwengerMarket(manager, {
        fetchMarketListings: mockFetch,
      });

      expect(result.counts.listings).toBe(2);
      expect(result.counts.skipped).toBe(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO market_listings'),
        expect.any(Array)
      );
    });
  });
});
