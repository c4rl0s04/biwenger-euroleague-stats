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
vi.mock('@/features/market/server', () => ({ getMarketPageData: vi.fn() }));

import {
  fetchMarketKPIs,
  fetchAllTransfers,
  fetchMarketTrends,
  fetchRecentTransfers,
  fetchMarketOpportunities,
  getMarketActivity,
} from './marketService';

beforeEach(() => {
  vi.resetAllMocks();
});

// Aggregate envelope/default/failure coverage moved to the owned Market activity service suite.

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
