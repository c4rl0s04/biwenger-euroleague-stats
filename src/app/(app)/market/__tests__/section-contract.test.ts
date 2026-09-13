import { beforeEach, expect, it, vi } from 'vitest';
import type { BiddingDuelsStats } from '@/features/market/public';

const fake = vi.hoisted(() => ({
  guard: vi.fn(),
  stats: vi.fn(),
  transfers: vi.fn(),
  trends: vi.fn(),
}));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: fake.guard }));
vi.mock('@/lib/services', () => ({
  fetchMarketStats: fake.stats,
  fetchAllTransfers: fake.transfers,
  fetchMarketTrendsAnalysis: fake.trends,
}));
vi.mock('@/components/mobile/MobileDetailScaffold', () => ({ default: () => null }));
vi.mock('@/components/mobile/MobileRecordList', () => ({ default: () => null }));
vi.mock('@/components/mobile/MobileScreen', () => ({ MobileSectionHeading: () => null }));
import MarketSectionPage from '../[section]/page';

beforeEach(() => {
  vi.resetAllMocks();
  fake.guard.mockResolvedValue({ definition: { title: 'Fixture section' } });
});

it('characterizes the existing phone bids failure with the actual duel contract shape', async () => {
  const biddingDuels: BiddingDuelsStats = {
    users: [],
    matrix: {},
    hottestRivalry: null,
    biggestDominance: null,
  };
  fake.stats.mockResolvedValue({ recordBid: [], biddingDuels, overpayerManager: [] });
  await expect(MarketSectionPage({ params: Promise.resolve({ section: 'bids' }) })).rejects.toThrow(
    TypeError
  );
  expect(fake.guard).toHaveBeenCalledWith('/market/bids');
  expect(fake.stats).toHaveBeenCalledExactlyOnceWith();
});

it('preserves the route guard before any data read', async () => {
  const redirect = new Error('fixture desktop redirect');
  fake.guard.mockRejectedValue(redirect);
  await expect(MarketSectionPage({ params: Promise.resolve({ section: 'bids' }) })).rejects.toBe(
    redirect
  );
  expect(fake.stats).not.toHaveBeenCalled();
  expect(fake.transfers).not.toHaveBeenCalled();
  expect(fake.trends).not.toHaveBeenCalled();
});
