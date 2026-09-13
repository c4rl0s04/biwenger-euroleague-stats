import { beforeEach, expect, it, vi } from 'vitest';
import type { BiddingDuelsStats } from '@/features/market/public';

const fake = vi.hoisted(() => ({
  guard: vi.fn(),
  stats: vi.fn(),
  section: vi.fn(),
}));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: fake.guard }));
vi.mock('@/features/market/server', () => ({
  fetchMarketStats: fake.stats,
  getMobileMarketSection: fake.section,
}));
vi.mock('@/features/market/public', () => ({ MarketSectionRows: () => null }));
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

it.each(['bids', 'transfers', 'investments', 'trends', 'unknown'])(
  'preserves the route guard before any data read for %s',
  async (section) => {
    const redirect = new Error('fixture desktop redirect');
    fake.guard.mockRejectedValue(redirect);
    await expect(MarketSectionPage({ params: Promise.resolve({ section }) })).rejects.toBe(
      redirect
    );
    expect(fake.stats).not.toHaveBeenCalled();
    expect(fake.section).not.toHaveBeenCalled();
  }
);

it.each(['transfers', 'trends', 'investments'])(
  'passes the guarded %s selection to the typed screen service',
  async (section) => {
    fake.section.mockResolvedValue({ rows: [] });
    const result = await MarketSectionPage({ params: Promise.resolve({ section }) });
    expect(fake.guard).toHaveBeenCalledWith(`/market/${section}`);
    expect(fake.section).toHaveBeenCalledExactlyOnceWith(section);
    expect(fake.stats).not.toHaveBeenCalled();
    expect(result.props.title).toBe('Fixture section');
    expect(result.props.backHref).toBe('/market');
    expect(result.props.children[1].props).toEqual({ rows: [] });
  }
);

it('propagates section read failures to the existing route error boundary', async () => {
  const failure = new Error('synthetic read failure');
  fake.section.mockRejectedValue(failure);
  await expect(
    MarketSectionPage({ params: Promise.resolve({ section: 'transfers' }) })
  ).rejects.toBe(failure);
});
