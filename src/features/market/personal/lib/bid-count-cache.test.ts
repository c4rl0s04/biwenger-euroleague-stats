import { describe, expect, it, vi } from 'vitest';
import type { LiveMarketListing } from '../../live/models/live-bidding';
import { BidCountCache } from './bid-count-cache';

const listing: LiveMarketListing = {
  playerId: 21,
  playerName: 'Player',
  sellerId: 5,
  sellerName: 'Owner',
  price: 100,
  closesAt: '2026-10-04T18:00:00.000Z',
  isOwnListing: false,
  ownWaitingOffers: [],
};

const marketObservedAt = '2026-10-04T10:00:00.000Z';

describe('private bid-count cache', () => {
  it('shares an in-flight request and reuses a fresh count', async () => {
    let resolve!: (value: number) => void;
    const fetchCount = vi.fn(() => new Promise<number>((done) => (resolve = done)));
    const cache = new BidCountCache(fetchCount, () => 1_000);
    const first = cache.load(listing, marketObservedAt);
    const second = cache.load(listing, marketObservedAt);
    expect(second).toBe(first);
    expect(fetchCount).toHaveBeenCalledOnce();
    resolve(2);
    await expect(first).resolves.toEqual({ totalBids: 2, fetchedAt: 1_000 });
    await expect(cache.load(listing, marketObservedAt)).resolves.toMatchObject({ totalBids: 2 });
    expect(fetchCount).toHaveBeenCalledOnce();
  });

  it('refreshes after the short TTL and after a market snapshot change', async () => {
    let now = 1_000;
    const fetchCount = vi
      .fn()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValue(3);
    const cache = new BidCountCache(fetchCount, () => now);
    await cache.load(listing, marketObservedAt);
    now += 20_000;
    await expect(cache.load(listing, marketObservedAt)).resolves.toMatchObject({ totalBids: 2 });
    await expect(cache.load(listing, '2026-10-04T10:01:00.000Z')).resolves.toMatchObject({
      totalBids: 3,
    });
    expect(fetchCount).toHaveBeenCalledTimes(3);
  });

  it('does not cache failed or invalid responses', async () => {
    const fetchCount = vi
      .fn()
      .mockResolvedValueOnce(-1)
      .mockRejectedValueOnce(new Error('offline'));
    const cache = new BidCountCache(fetchCount, () => 1_000);
    await expect(cache.load(listing, marketObservedAt)).rejects.toThrow('no válido');
    await expect(cache.load(listing, marketObservedAt)).rejects.toThrow('offline');
    expect(cache.peek(listing, marketObservedAt)).toBeUndefined();
  });
});
