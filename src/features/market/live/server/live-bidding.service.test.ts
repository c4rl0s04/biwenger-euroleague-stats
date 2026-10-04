import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({ CONFIG: { API: { LEAGUE_ID: '9' } } }));

const executeQuery = vi.fn();
vi.mock('@/features/provider/server', () => ({
  executeUserProviderQuery: (...args: unknown[]) => executeQuery(...args),
}));

import {
  getLiveBidMarket,
  getLivePlayerBidCount,
  LiveBidCountUnavailableError,
} from './services/live-bidding.service';

const account = (type = 'premium') => ({
  status: 200,
  data: { leagues: [{ id: 9, type, user: { id: 7 }, settings: { marketShowBids: true } }] },
});
const market = {
  status: 200,
  data: {
    status: { balance: 100, maximumBid: 2_000_000 },
    sales: [
      { player: { id: 1 }, price: 1_000_000, until: 2_000_000_000, user: null },
      {
        player: { id: 2 },
        price: 1_100_000,
        until: 2_000_000_000,
        user: { id: 8, name: 'Seller' },
      },
    ],
    offers: [],
  },
};

describe('live bidding service', () => {
  const query = vi.fn();
  const command = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    executeQuery.mockImplementation(async (_userId, _operation, callback) =>
      callback({ query, command }, { token: 'private-token', userId: '7' })
    );
    query.mockImplementation(async (path) => {
      if (path === '/account') return account();
      if (path === '/market') return market;
      if (path.startsWith('/competitions/'))
        return { status: 200, data: { players: { 1: { name: 'A' }, 2: { name: 'B' } } } };
      throw new Error('unexpected path');
    });
    command.mockResolvedValue({ raw: { status: 200, data: 2 } });
  });

  it('returns a named live snapshot with no-store reads and the actor context', async () => {
    const result = await getLiveBidMarket('7');
    expect(result.listings.map((item) => item.playerName)).toEqual(['A', 'B']);
    expect(query).toHaveBeenCalledWith(
      '/market',
      { cache: 'no-store' },
      {
        token: 'private-token',
        userId: '7',
        leagueId: '9',
      }
    );
  });

  it('sends the observed bid-count payload, including seller only for manager listings', async () => {
    expect((await getLivePlayerBidCount('7', 1)).totalBids).toBe(2);
    expect(command).toHaveBeenLastCalledWith(
      '/market/bids',
      {
        method: 'POST',
        body: { player: 1 },
        retries: 0,
      },
      expect.objectContaining({ userId: '7', leagueId: '9' })
    );
    await getLivePlayerBidCount('7', 2);
    expect(command).toHaveBeenLastCalledWith(
      '/market/bids',
      {
        method: 'POST',
        body: { player: 2, user: 8 },
        retries: 0,
      },
      expect.objectContaining({ userId: '7', leagueId: '9' })
    );
  });

  it('does not call the potentially credit-spending endpoint outside Premium', async () => {
    query.mockImplementation(async (path) => (path === '/account' ? account('normal') : market));
    await expect(getLivePlayerBidCount('7', 1)).rejects.toThrow(LiveBidCountUnavailableError);
    expect(command).not.toHaveBeenCalled();
  });
});
