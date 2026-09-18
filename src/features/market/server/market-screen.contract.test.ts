import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ listings: vi.fn(), kpis: vi.fn(), transfers: vi.fn() }));
vi.mock('./services/market-catalogue.service', () => ({ getCurrentMarketListings: fake.listings }));
vi.mock('./services/market-activity.service', () => ({ getMarketKPIs: fake.kpis }));
vi.mock('./services/market-activity-extra.service', () => ({ getRecentTransfers: fake.transfers }));
import { getMobileMarketOverview, MARKET_SCREEN_POLICY } from './services/market-screen.service';

beforeEach(() => {
  vi.resetAllMocks();
  fake.listings.mockResolvedValue([]);
  fake.kpis.mockResolvedValue({
    total_transfers: 0,
    avg_value: 0,
    max_value: 0,
    min_value: 0,
    active_buyers: 0,
    active_sellers: 0,
  });
  fake.transfers.mockResolvedValue([]);
});

it('starts all three existing reads in parallel and keeps the four-transfer limit', async () => {
  let release!: (value: []) => void;
  fake.listings.mockImplementation(
    () =>
      new Promise<[]>((resolve) => {
        release = resolve;
      })
  );
  const pending = getMobileMarketOverview();
  expect(fake.listings).toHaveBeenCalledExactlyOnceWith();
  expect(fake.kpis).toHaveBeenCalledExactlyOnceWith();
  expect(fake.transfers).toHaveBeenCalledExactlyOnceWith(4);
  release([]);
  expect(await pending).toEqual({
    listings: [],
    kpis: await fake.kpis.mock.results[0].value,
    recentTransfers: [],
  });
});

it.each(['listings', 'kpis', 'transfers'] as const)(
  'preserves %s failure propagation',
  async (name) => {
    const error = new Error('synthetic read failure');
    fake[name].mockRejectedValue(error);
    await expect(getMobileMarketOverview()).rejects.toBe(error);
  }
);

it('does not add a server cache or identity lookup', async () => {
  await getMobileMarketOverview();
  await getMobileMarketOverview();
  expect(fake.listings).toHaveBeenCalledTimes(2);
  expect(fake.transfers).toHaveBeenCalledTimes(2);
  expect(MARKET_SCREEN_POLICY).toMatchObject({ identity: 'none', serverCache: 'none' });
});
