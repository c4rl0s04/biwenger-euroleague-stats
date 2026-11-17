import type { LiveMarketListing } from '../../live/models/live-bidding';

export interface CountSnapshot {
  totalBids: number;
  fetchedAt: number;
}

const keyFor = (listing: LiveMarketListing, marketObservedAt: string) =>
  `${marketObservedAt}:${listing.playerId}:${listing.sellerId ?? 'market'}:${listing.price}:${listing.closesAt}`;

/** Short-lived browser cache scoped to one private bidding screen. */
export class BidCountCache {
  private readonly entries = new Map<string, CountSnapshot>();
  private readonly pending = new Map<string, Promise<CountSnapshot>>();

  constructor(
    private readonly fetchCount: (playerId: number) => Promise<number>,
    private readonly now: () => number = Date.now,
    private readonly ttlMs = 20_000
  ) {}

  peek(listing: LiveMarketListing, marketObservedAt: string): CountSnapshot | undefined {
    return this.entries.get(keyFor(listing, marketObservedAt));
  }

  isFresh(snapshot: CountSnapshot): boolean {
    return this.now() - snapshot.fetchedAt < this.ttlMs;
  }

  load(listing: LiveMarketListing, marketObservedAt: string): Promise<CountSnapshot> {
    const key = keyFor(listing, marketObservedAt);
    const cached = this.entries.get(key);
    if (cached && this.isFresh(cached)) return Promise.resolve(cached);
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    const request = this.fetchCount(listing.playerId)
      .then((totalBids) => {
        if (!Number.isSafeInteger(totalBids) || totalBids < 0) {
          throw new Error('Biwenger devolvió un contador no válido.');
        }
        const snapshot = { totalBids, fetchedAt: this.now() };
        this.entries.set(key, snapshot);
        return snapshot;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}
