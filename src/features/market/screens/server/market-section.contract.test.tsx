import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
// Header actions are unrelated to the real MobileListRow used in both render paths.
vi.mock('@/components/mobile/MobileHeaderActions', () => ({ default: () => null }));
import MobileRecordList from '@/components/mobile/MobileRecordList';
import MarketSectionRows from '../components/MarketSectionRows';
import {
  mapMarketTransferRows,
  mapMarketInvestmentRows,
  mapMarketTrendRows,
} from './mappers/market-section.mapper';
import type { MarketActivityTransfer } from '../../trends/models/market-activity';
import type { SingleFlip } from '../../analytics/models/market-investments';
const fake = vi.hoisted(() => ({ transfers: vi.fn(), trends: vi.fn(), stats: vi.fn() }));
vi.mock('../../trends/server/services/market-activity.service', () => ({
  getAllTransfers: fake.transfers,
}));
vi.mock('../../trends/server/services/market-trends.service', () => ({
  getMarketTrendsAnalysis: fake.trends,
}));
vi.mock('../../analytics/server/services/market-analytics.service', () => ({
  fetchMarketStats: fake.stats,
}));
import { getMobileMarketSection, MARKET_SECTION_POLICY } from './services/market-section.service';

beforeEach(() => vi.resetAllMocks());

it.each([0, 1, 25])(
  'preserves transfer markup, limit and nullish links for %i records',
  (count) => {
    const records: MarketActivityTransfer[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      player_id: i % 2 ? 9 : null,
      fecha: null,
      precio: i % 2 ? -1234.5 : null,
      comprador: i % 2 ? '' : null,
      vendedor: i % 2 ? 'Seller' : null,
    }));
    const rows = mapMarketTransferRows(records);
    expect(renderToStaticMarkup(<MarketSectionRows rows={rows} />)).toBe(
      renderToStaticMarkup(<MobileRecordList data={records} linkPrefix="/player" />)
    );
    expect(rows.length).toBe(Math.min(count, 20));
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
  }
);

it('preserves investment labels, value and priority without exposing source fields', () => {
  const flip: SingleFlip = {
    user_id: '7',
    user_name: 'Manager',
    user_color_index: null,
    player_id: null,
    player_name: null,
    player_img: null,
    purchase_price: 30,
    sale_price: 20,
    profit: -10,
  };
  const rows = mapMarketInvestmentRows([flip]);
  expect(renderToStaticMarkup(<MarketSectionRows rows={rows} />)).toBe(
    renderToStaticMarkup(<MobileRecordList data={[flip]} />)
  );
  expect(rows).toEqual([{ key: '7', title: 'Manager', subtitle: null, value: -10, href: null }]);
});

it('preserves existing ordinal-only trend output rather than redesigning it', () => {
  const records = [{ date: '2025-01-01', volume: 100, avg_price: 20, ops_count: 5, transfers: [] }];
  expect(renderToStaticMarkup(<MarketSectionRows rows={mapMarketTrendRows(records)} />)).toBe(
    renderToStaticMarkup(<MobileRecordList data={records} />)
  );
});

it('keeps transfer defaults, trend 30-day selection and separate read branches', async () => {
  fake.transfers.mockResolvedValue([]);
  fake.trends.mockResolvedValue([]);
  expect(await getMobileMarketSection('transfers')).toEqual({ rows: [] });
  expect(fake.transfers).toHaveBeenCalledWith();
  expect(fake.trends).not.toHaveBeenCalled();
  expect(await getMobileMarketSection('trends')).toEqual({ rows: [] });
  expect(fake.trends).toHaveBeenCalledWith(30);
  expect(fake.stats).not.toHaveBeenCalled();
});

it('keeps aggregate call count, investment group order and total 20-row limit', async () => {
  const group = (name: string) => Array.from({ length: 6 }, () => ({ player_name: name }));
  fake.stats.mockResolvedValue({
    bestFlip: group('best'),
    bestRevaluation: group('value'),
    worstFlip: group('worst'),
    missedOpportunity: group('missed'),
  });
  const model = await getMobileMarketSection('investments');
  expect(model.rows.map((row) => row.title)).toEqual([
    ...Array(6).fill('best'),
    ...Array(6).fill('value'),
    ...Array(6).fill('worst'),
    ...Array(2).fill('missed'),
  ]);
  expect(fake.stats).toHaveBeenCalledTimes(1);
  expect(fake.transfers).not.toHaveBeenCalled();
  expect(fake.trends).not.toHaveBeenCalled();
});

it('propagates failures and does not memoize repeated reads', async () => {
  const error = new Error('synthetic');
  fake.transfers.mockRejectedValue(error);
  await expect(getMobileMarketSection('transfers')).rejects.toBe(error);
  await expect(getMobileMarketSection('transfers')).rejects.toBe(error);
  expect(fake.transfers).toHaveBeenCalledTimes(2);
  expect(MARKET_SECTION_POLICY.serverCache).toBe('none');
  expect(MARKET_SECTION_POLICY.identity).toBe('none');
});

it('renders bids from the object aggregate, deduplicates duels and returns serializable rows', async () => {
  fake.stats.mockResolvedValue({
    recordBid: [{ transfer_id: 12, player_name: 'Player', player_team: 'Team', precio: 120 }],
    biddingDuels: {
      users: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ],
      matrix: { 1: { 2: { duels: 3 } }, 2: { 1: { duels: 3 } } },
    },
    overpayerManager: [{ user_id: '1', name: 'First', total_overpay: 20 }],
  });
  const model = await getMobileMarketSection('bids');
  expect(model.rows).toEqual([
    { key: 'bid-12', title: 'Player', subtitle: 'Team', value: 120, href: null },
    {
      key: 'duel-1-2',
      title: 'First / Second',
      subtitle: 'Pujas disputadas',
      value: 3,
      href: null,
    },
    { key: 'overpayer-1', title: 'First', subtitle: 'Sobreprecio total', value: 20, href: null },
  ]);
  expect(JSON.parse(JSON.stringify(model))).toEqual(model);
  expect(fake.stats).toHaveBeenCalledTimes(1);
});

it('handles empty bids and keeps the existing 20-row limit', async () => {
  fake.stats.mockResolvedValue({
    recordBid: [],
    biddingDuels: { users: [], matrix: {} },
    overpayerManager: [],
  });
  expect(await getMobileMarketSection('bids')).toEqual({ rows: [] });
  fake.stats.mockResolvedValue({
    recordBid: Array.from({ length: 30 }, (_, i) => ({
      transfer_id: i,
      player_name: 'Player',
      player_team: null,
      precio: i,
    })),
  });
  expect((await getMobileMarketSection('bids')).rows).toHaveLength(20);
});
