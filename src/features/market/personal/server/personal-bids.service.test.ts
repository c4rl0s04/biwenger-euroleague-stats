import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({ CONFIG: { API: { USER_ID: '7' } } }));
const mocks = vi.hoisted(() => ({ market: vi.fn(), count: vi.fn(), place: vi.fn() }));
vi.mock('@/features/market/live/server/services/live-bidding.service', () => ({
  getLiveBidMarket: mocks.market,
  getLivePlayerBidCount: mocks.count,
}));
vi.mock('@/features/market/commands/server/services/market-command.service', () => ({
  marketCommandService: { placeBid: mocks.place },
}));

import {
  assertPersonalBidAccess,
  readPersonalBidWorkspace,
  readPersonalBidCount,
  placePersonalBidNow,
} from './services/personal-bids.service';

beforeEach(() => vi.clearAllMocks());

const payload = {
  playerId: 21,
  amount: 120,
  expectedListing: { sellerId: 5, price: 100, closesAt: '2026-10-04T18:00:00.000Z' },
};

describe('personal manual bids', () => {
  it('restricts reads and writes to the configured manager', async () => {
    expect(() => assertPersonalBidAccess('8')).toThrow();
    await expect(readPersonalBidWorkspace('8')).rejects.toMatchObject({ status: 403 });
    await expect(readPersonalBidCount('8', 21)).rejects.toMatchObject({ status: 403 });
    await expect(placePersonalBidNow('8', payload)).rejects.toMatchObject({ status: 403 });
    expect(mocks.market).not.toHaveBeenCalled();
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it('loads only the live market for the workspace', async () => {
    const market = { balance: 500, maximumBid: 300, listings: [] };
    mocks.market.mockResolvedValue(market);
    await expect(readPersonalBidWorkspace('7')).resolves.toEqual({ market });
    expect(mocks.market).toHaveBeenCalledWith('7');
  });

  it('queries a selected player bid count', async () => {
    mocks.count.mockResolvedValue({ playerId: 21, totalBids: 2 });
    await expect(readPersonalBidCount('7', 21)).resolves.toMatchObject({ totalBids: 2 });
    expect(mocks.count).toHaveBeenCalledWith('7', 21);
  });

  it('validates input and delegates one immediate offer to the market command', async () => {
    await expect(placePersonalBidNow('7', { ...payload, amount: 0 })).rejects.toMatchObject({
      code: 'invalid_input',
    });
    expect(mocks.place).not.toHaveBeenCalled();
    mocks.place.mockResolvedValue({ status: 'completed' });
    await expect(placePersonalBidNow('7', payload)).resolves.toMatchObject({ status: 'completed' });
    expect(mocks.place).toHaveBeenCalledExactlyOnceWith('7', payload);
  });
});
