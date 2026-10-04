import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BiwengerNetworkError } from '@/features/provider/server';

const executeCommand = vi.fn();
const readMarket = vi.fn();
vi.mock('@/features/provider/server', async () => ({
  ...(await vi.importActual<typeof import('@/features/provider/server')>(
    '@/features/provider/server'
  )),
  executeUserProviderCommand: (...args: unknown[]) => executeCommand(...args),
}));
vi.mock('../../live/server/services/live-bidding.service', () => ({
  readLiveBidMarket: (...args: unknown[]) => readMarket(...args),
}));

import {
  createMarketCommandService,
  MarketBidConflictError,
  MarketBidOutcomeUnknownError,
} from '../server/services/market-command.service';

const closesAt = '2033-01-01T00:00:00.000Z';
const input = {
  playerId: 42,
  amount: 1_500_000,
  expectedListing: { sellerId: null, price: 1_000_000, closesAt },
};
const listing = {
  playerId: 42,
  playerName: 'Player',
  sellerId: null,
  sellerName: 'Mercado libre',
  price: 1_000_000,
  closesAt,
  isOwnListing: false,
  ownWaitingOffers: [],
};

describe('placeMarketBid command', () => {
  const command = vi.fn();
  const service = createMarketCommandService({ clearLocalPlayerOwner: vi.fn() });

  beforeEach(() => {
    vi.clearAllMocks();
    executeCommand.mockImplementation(async (_userId, _operation, callback) =>
      callback({ command }, { token: 'private-token', userId: '7' })
    );
    readMarket.mockResolvedValue({
      market: { maximumBid: 2_000_000, listings: [listing] },
      providerContext: { token: 'private-token', userId: '7', leagueId: '9' },
    });
    command.mockResolvedValue({
      status: 'completed',
      httpStatus: 200,
      raw: { status: 200, data: { id: 99 } },
    });
  });

  it('builds the observed free-market offer from the fresh listing and does not retry', async () => {
    await expect(service.placeBid('7', input)).resolves.toEqual({
      status: 'completed',
      playerId: 42,
      amount: 1_500_000,
      offerId: 99,
    });
    expect(command).toHaveBeenCalledTimes(1);
    expect(command).toHaveBeenCalledWith(
      '/offers',
      {
        method: 'POST',
        body: { to: null, type: 'purchase', amount: 1_500_000, requestedPlayers: [42] },
        retries: 0,
      },
      { token: 'private-token', userId: '7', leagueId: '9' }
    );
  });

  it('uses the seller in the fresh listing for a manager-owned player', async () => {
    readMarket.mockResolvedValue({
      market: { maximumBid: 2_000_000, listings: [{ ...listing, sellerId: 8 }] },
      providerContext: { token: 'private-token', userId: '7', leagueId: '9' },
    });
    await service.placeBid('7', {
      ...input,
      expectedListing: { ...input.expectedListing, sellerId: 8 },
    });
    expect(command.mock.calls[0][1].body.to).toBe(8);
  });

  it.each([
    ['changed listing', { ...listing, price: 1_100_000 }, 'listing_changed'],
    ['own listing', { ...listing, isOwnListing: true }, 'own_listing'],
    [
      'existing offer',
      { ...listing, ownWaitingOffers: [{ id: 1, amount: 1_200_000 }] },
      'existing_offer',
    ],
  ])('blocks %s before POST', async (_label, changed, code) => {
    readMarket.mockResolvedValue({
      market: { maximumBid: 2_000_000, listings: [changed] },
      providerContext: {},
    });
    await expect(service.placeBid('7', input)).rejects.toMatchObject({
      name: 'MarketBidConflictError',
      code,
    });
    expect(command).not.toHaveBeenCalled();
  });

  it('blocks a matching listing after its deadline', async () => {
    const closedAt = '2020-01-01T00:00:00.000Z';
    readMarket.mockResolvedValue({
      market: { maximumBid: 2_000_000, listings: [{ ...listing, closesAt: closedAt }] },
      providerContext: {},
    });
    await expect(
      service.placeBid('7', {
        ...input,
        expectedListing: { ...input.expectedListing, closesAt: closedAt },
      })
    ).rejects.toMatchObject({ code: 'listing_closed' });
    expect(command).not.toHaveBeenCalled();
  });

  it('blocks amounts outside fresh price and maximum bid', async () => {
    await expect(service.placeBid('7', { ...input, amount: 999_999 })).rejects.toThrow(
      MarketBidConflictError
    );
    await expect(service.placeBid('7', { ...input, amount: 2_000_001 })).rejects.toThrow(
      MarketBidConflictError
    );
    expect(command).not.toHaveBeenCalled();
  });

  it('marks a network failure after POST as uncertain', async () => {
    command.mockRejectedValue(new BiwengerNetworkError('timeout', '/offers'));
    await expect(service.placeBid('7', input)).rejects.toThrow(MarketBidOutcomeUnknownError);
    expect(command).toHaveBeenCalledTimes(1);
  });
});
