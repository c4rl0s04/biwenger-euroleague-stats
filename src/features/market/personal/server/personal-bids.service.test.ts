import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({ CONFIG: { API: { USER_ID: '7', LEAGUE_ID: '9' } } }));
const mocks = vi.hoisted(() => ({
  market: vi.fn(),
  count: vi.fn(),
  place: vi.fn(),
  claim: vi.fn(),
  finish: vi.fn(),
  insert: vi.fn(),
  attach: vi.fn(),
  fail: vi.fn(),
  publish: vi.fn(),
  cancel: vi.fn(),
  list: vi.fn(),
}));
vi.mock('@/features/market/live/server/services/live-bidding.service', () => ({
  getLiveBidMarket: mocks.market,
  getLivePlayerBidCount: mocks.count,
  LiveBidCountUnavailableError: class LiveBidCountUnavailableError extends Error {},
}));
vi.mock('@/features/market/commands/server/services/market-command.service', () => ({
  marketCommandService: { placeBid: mocks.place },
  MarketBidConflictError: class MarketBidConflictError extends Error {},
  MarketBidOutcomeUnknownError: class MarketBidOutcomeUnknownError extends Error {},
}));
vi.mock('@/features/market/personal/server/repositories/personal-bid.repository', () => ({
  claimPersonalBidRule: mocks.claim,
  finishPersonalBidRule: mocks.finish,
  insertPersonalBidRule: mocks.insert,
  attachQueueMessage: mocks.attach,
  failScheduling: mocks.fail,
  cancelPersonalBidRule: mocks.cancel,
  listPersonalBidRules: mocks.list,
}));
vi.mock('@upstash/qstash', () => ({
  Client: class {
    publishJSON = mocks.publish;
  },
  Receiver: class {
    verify = vi.fn().mockResolvedValue(true);
  },
}));

import {
  executeScheduledPersonalBid,
  schedulePersonalBid,
  assertPersonalBidAccess,
} from './services/personal-bids.service';

const closesAt = new Date(Date.now() + 60 * 60_000).toISOString();
const listing = {
  playerId: 21,
  playerName: 'Player',
  sellerId: 5,
  sellerName: 'Seller',
  price: 100,
  closesAt,
  isOwnListing: false,
  ownWaitingOffers: [],
};
const market = {
  balance: 500,
  maximumBid: 300,
  observedAt: new Date().toISOString(),
  listings: [listing],
};
const rule = {
  id: '2a594ceb-2c3b-423e-9c55-70cdb1db9328',
  userId: '7',
  leagueId: 9,
  playerId: 21,
  sellerId: 5,
  listingPrice: 100,
  closesAt: new Date(closesAt),
  executeAt: new Date(Date.now() - 1000),
  amountWithoutBids: 110,
  amountWithBids: 160,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.market.mockResolvedValue(market);
  mocks.count.mockResolvedValue({ totalBids: 0 });
  mocks.place.mockResolvedValue({ status: 'completed' });
  mocks.claim.mockResolvedValue(rule);
  mocks.finish.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('personal bid execution', () => {
  it('restricts the workspace to the configured manager', () => {
    expect(() => assertPersonalBidAccess('8')).toThrow();
    expect(() => assertPersonalBidAccess('7')).not.toThrow();
  });

  it.each([
    [0, 110],
    [2, 160],
  ])('selects the correct conditional amount for %i bids', async (totalBids, amount) => {
    mocks.count.mockResolvedValue({ totalBids });
    expect(await executeScheduledPersonalBid(rule.id)).toBe('submitted');
    expect(mocks.place).toHaveBeenCalledWith('7', expect.objectContaining({ amount }));
    expect(mocks.finish).toHaveBeenCalledWith(rule.id, 'submitted', 'bid_submitted', amount);
  });

  it('never posts when claim fails on repeated delivery', async () => {
    mocks.claim.mockResolvedValue(null);
    expect(await executeScheduledPersonalBid(rule.id)).toBe('ignored');
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it('skips when an existing personal offer appears before execution', async () => {
    mocks.market.mockResolvedValue({
      ...market,
      listings: [{ ...listing, ownWaitingOffers: [{ id: 44, amount: 120 }] }],
    });
    expect(await executeScheduledPersonalBid(rule.id)).toBe('skipped');
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it('marks an ambiguous provider outcome without retrying', async () => {
    const { MarketBidOutcomeUnknownError } =
      await import('@/features/market/commands/server/services/market-command.service');
    mocks.place.mockRejectedValue(new MarketBidOutcomeUnknownError());
    expect(await executeScheduledPersonalBid(rule.id)).toBe('uncertain');
    expect(mocks.finish).toHaveBeenCalledWith(rule.id, 'uncertain', 'provider_outcome_unknown');
  });
});

describe('personal bid scheduling', () => {
  it('reports an existing active instruction from a wrapped database conflict', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'test-token');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'test-current');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'test-next');
    vi.stubEnv('PERSONAL_BID_CALLBACK_URL', 'https://example.com/api/personal/bids/execute');
    mocks.insert.mockRejectedValue({ cause: { code: '23505' } });
    await expect(
      schedulePersonalBid('7', {
        playerId: 21,
        expectedListing: { sellerId: 5, price: 100, closesAt },
        amountWithoutBids: 110,
        amountWithBids: 160,
        minutesBeforeClose: 5,
      })
    ).rejects.toMatchObject({ code: 'already_scheduled', status: 409 });
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  it('publishes a one-shot message containing only the rule ID', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'test-token');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'test-current');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'test-next');
    vi.stubEnv('PERSONAL_BID_CALLBACK_URL', 'https://example.com/api/personal/bids/execute');
    mocks.insert.mockImplementation(async (row) => ({ ...row, status: 'pending' }));
    mocks.publish.mockResolvedValue({ messageId: 'msg-1' });
    const result = await schedulePersonalBid('7', {
      playerId: 21,
      expectedListing: { sellerId: 5, price: 100, closesAt },
      amountWithoutBids: 110,
      amountWithBids: 160,
      minutesBeforeClose: 5,
    });
    expect(result.status).toBe('pending');
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/api/personal/bids/execute',
        body: { ruleId: result.id },
        retries: 0,
        notBefore: Math.ceil((Date.parse(closesAt) - 5 * 60_000) / 1000),
      })
    );
    expect(mocks.attach).toHaveBeenCalledWith(result.id, 'msg-1');
  });

  it('refuses schedules if the live bid count cannot be read safely', async () => {
    mocks.count.mockRejectedValue(new Error('Premium required'));
    await expect(
      schedulePersonalBid('7', {
        playerId: 21,
        expectedListing: { sellerId: 5, price: 100, closesAt },
        amountWithoutBids: 110,
        amountWithBids: 160,
        minutesBeforeClose: 5,
      })
    ).rejects.toThrow('Premium required');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
