import { beforeEach, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({
  phone: vi.fn(),
  overview: vi.fn(),
  desktop: vi.fn(),
  mobile: vi.fn(),
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: fake.phone }));
vi.mock('@/features/market/server', () => ({ getMobileMarketOverview: fake.overview }));
vi.mock('@/features/market/public', () => ({
  DesktopMarketScreen: fake.desktop,
  MobileMarketScreen: fake.mobile,
}));
import MarketPage from '../page';

beforeEach(() => vi.resetAllMocks());

it('keeps desktop browser loading without fetching phone data on the server', async () => {
  fake.phone.mockResolvedValue(false);
  expect((await MarketPage()).type).toBe(fake.desktop);
  expect(fake.overview).not.toHaveBeenCalled();
});

it('passes the owned phone model without transforming or duplicating reads', async () => {
  fake.phone.mockResolvedValue(true);
  const model = { listings: [], kpis: { total_transfers: 7 }, recentTransfers: [] };
  fake.overview.mockResolvedValue(model);
  const result = await MarketPage();
  expect(result.type).toBe(fake.mobile);
  expect(result.props).toEqual(model);
  expect(fake.overview).toHaveBeenCalledExactlyOnceWith();
});

it('preserves unexpected read failures for the existing framework error boundary', async () => {
  fake.phone.mockResolvedValue(true);
  const error = new Error('synthetic read failure');
  fake.overview.mockRejectedValue(error);
  await expect(MarketPage()).rejects.toBe(error);
});
