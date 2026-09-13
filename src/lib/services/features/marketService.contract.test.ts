import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const queries = vi.hoisted(() => ({
  getMarketKPIs: vi.fn(),
  getAllTransfers: vi.fn(),
  getMarketTrends: vi.fn(),
  getRecentTransfers: vi.fn(),
  getMarketOpportunities: vi.fn(),
}));
vi.mock('../../db', () => queries);

import {
  fetchMarketKPIs,
  fetchAllTransfers,
  fetchMarketTrends,
  fetchRecentTransfers,
  fetchMarketOpportunities,
  getMarketPageData,
  getMarketActivity,
} from './marketService';

beforeEach(() => {
  vi.resetAllMocks();
});

it('preserves the page envelope, query defaults and nullable/string results', async () => {
  const kpis = { total_transfers: '2', total_volume: null };
  const transfers = [{ id: '007', precio: '100', vendedor: null }];
  const trends = [{ date: '2026-01-01', volume: '100' }];
  queries.getMarketKPIs.mockResolvedValue(kpis);
  queries.getAllTransfers.mockResolvedValue(transfers);
  queries.getMarketTrends.mockResolvedValue(trends);
  expect(await getMarketPageData()).toEqual({ kpis, transfers, trends });
  for (const query of [queries.getMarketKPIs, queries.getAllTransfers, queries.getMarketTrends]) {
    expect(query).toHaveBeenCalledExactlyOnceWith();
  }
});

it('retains service-specific recent-transfer and opportunity defaults', async () => {
  queries.getRecentTransfers.mockResolvedValue([]);
  queries.getMarketOpportunities.mockResolvedValue([]);
  await fetchRecentTransfers();
  await getMarketActivity();
  await getMarketActivity({ limit: 4 });
  await fetchRecentTransfers(8);
  expect(queries.getRecentTransfers.mock.calls).toEqual([[20], [20], [4], [8]]);
  await fetchMarketOpportunities();
  await fetchMarketOpportunities(8);
  expect(queries.getMarketOpportunities.mock.calls).toEqual([[6], [8]]);
});

it('does not cache repeated reads or replace query failures with empty results', async () => {
  for (const [service, query] of [
    [fetchMarketKPIs, queries.getMarketKPIs],
    [fetchAllTransfers, queries.getAllTransfers],
    [fetchMarketTrends, queries.getMarketTrends],
  ] as const) {
    query.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('fixture failure'));
    expect(await service()).toEqual([]);
    await expect(service()).rejects.toThrow('fixture failure');
    expect(query).toHaveBeenCalledTimes(2);
  }
});

it('rejects the aggregate if one constituent fails', async () => {
  queries.getMarketKPIs.mockResolvedValue({});
  queries.getAllTransfers.mockRejectedValue(new Error('fixture transfer failure'));
  queries.getMarketTrends.mockResolvedValue([]);
  await expect(getMarketPageData()).rejects.toThrow('fixture transfer failure');
  expect(queries.getMarketTrends).toHaveBeenCalledExactlyOnceWith();
});
