import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const queries = vi.hoisted(() =>
  Object.fromEntries(
    [
      'getMarketOverviewKPIs',
      'getTopTransferredPlayer',
      'getRecordTransfer',
      'getBigSpender',
      'getRecordBid',
      'getMarketTrendsAnalysis',
      'getPositionAnalysis',
      'getLiveMarketTransfers',
      'getManagerMarketStats',
      'getBestSeller',
      'getBestRevaluation',
      'getBestValuePlayer',
      'getBestValueDetails',
      'getInfirmaryPlayers',
      'getBestSingleFlip',
      'getWorstSingleFlip',
      'getBestPercentageGain',
      'getMostOwnersPlayer',
      'getTheThief',
      'getBiggestSteal',
      'getTheVictim',
      'getOverpayerManager',
      'getInflatedPlayer',
      'getBiddingDuelsStats',
      'getBiddingDuelDetails',
      'getMissedOpportunity',
      'getTopTrader',
      'getProfitablePlayer',
      'getLossyPlayer',
      'getQuickestFlip',
      'getLongestProfitableHold',
      'getWorstRevaluation',
      'getCurrentMarketListings',
      'getAllUsers',
    ].map((name) => [name, vi.fn()])
  )
);
vi.mock('../db', () => queries);

import {
  fetchMarketStats,
  fetchCurrentMarketListings,
  fetchLiveMarketTransfers,
  fetchMarketTrendsAnalysis,
  fetchBestValueDetails,
  fetchBiddingDuelDetails,
} from './marketService';

beforeEach(() => {
  vi.resetAllMocks();
  Object.values(queries).forEach((query) => query.mockResolvedValue([]));
});

it('preserves all aggregate keys and invokes each constituent once without overriding defaults', async () => {
  const result = await fetchMarketStats();
  expect(Object.keys(result)).toEqual([
    'kpis',
    'topPlayer',
    'recordTransfer',
    'bigSpender',
    'recordBid',
    'trends',
    'positionStats',
    'managerStats',
    'bestSeller',
    'bestRevaluation',
    'bestValue',
    'infirmary',
    'bestFlip',
    'worstFlip',
    'bestPercentage',
    'mostOwners',
    'theThief',
    'biggestSteal',
    'theVictim',
    'overpayerManager',
    'inflatedPlayer',
    'biddingDuels',
    'missedOpportunity',
    'topTrader',
    'profitablePlayer',
    'lossyPlayer',
    'quickestFlip',
    'longestHold',
    'worstRevaluation',
    'currentMarketListings',
    'allUsers',
  ]);
  const separateReads = new Set([
    'getLiveMarketTransfers',
    'getBestValueDetails',
    'getBiddingDuelDetails',
  ]);
  for (const [name, query] of Object.entries(queries)) {
    if (separateReads.has(name)) expect(query).not.toHaveBeenCalled();
    else expect(query).toHaveBeenCalledExactlyOnceWith();
  }
});

it('matches names exactly, keeps text IDs, takes the first duplicate and preserves unmatched rows', async () => {
  const users = [
    { id: '007', name: 'Fixture A', icon: null, color_index: 2 },
    { id: '008', name: 'Fixture A', icon: 'unused', color_index: 3 },
    { id: '009', name: null, icon: null, color_index: 4 },
  ];
  queries.getAllUsers.mockResolvedValue(users);
  queries.getBigSpender.mockResolvedValue([
    { name: 'Fixture A', total_spent: '17', user_id: 'old' },
    { name: 'fixture a', total_spent: null },
    { name: null, total_spent: 0 },
  ]);
  const result = await fetchMarketStats();
  expect(result.bigSpender).toEqual([
    {
      name: 'Fixture A',
      total_spent: '17',
      user_id: 'old',
      id: '007',
      icon: null,
      color_index: 2,
      user_color_index: 2,
    },
    { name: 'fixture a', total_spent: null },
    { name: null, total_spent: 0, id: '009', icon: null, color_index: 4, user_color_index: 4 },
  ]);
  expect(result.allUsers).toEqual(users);
});

it('retains buyer aliases and the second bidder overwriting the shared color compatibility field', async () => {
  queries.getAllUsers.mockResolvedValue([
    { id: '007', name: 'Winner', icon: 'winner.png', color_index: 2 },
    { id: '008', name: 'Runner', icon: null, color_index: 3 },
  ]);
  queries.getRecordBid.mockResolvedValue([
    { comprador: 'Winner', buyer_id: 'previous', buyer_color_index: 9 },
  ]);
  queries.getBiggestSteal.mockResolvedValue([
    { winner: 'Winner', second_bidder_name: 'Runner', price_diff: '10' },
  ]);
  const result = await fetchMarketStats();
  expect(result.recordBid).toEqual([
    {
      comprador: 'Winner',
      buyer_id: '007',
      buyer_color_index: 9,
      buyer_icon: 'winner.png',
      buyer_color: 2,
      user_color_index: 2,
    },
  ]);
  expect(result.biggestSteal).toEqual([
    {
      winner: 'Winner',
      second_bidder_name: 'Runner',
      price_diff: '10',
      winner_id: '007',
      winner_icon: 'winner.png',
      winner_color: 2,
      second_bidder_id: '008',
      second_bidder_icon: null,
      second_bidder_color: 3,
      user_color_index: 3,
    },
  ]);
});

it('propagates aggregate failure without returning a partial response or caching success', async () => {
  await fetchMarketStats();
  queries.getMarketOverviewKPIs.mockRejectedValue(new Error('fixture failure'));
  await expect(fetchMarketStats()).rejects.toThrow('fixture failure');
  expect(queries.getCurrentMarketListings).toHaveBeenCalledTimes(2);
  expect(queries.getAllUsers).toHaveBeenCalledTimes(2);
});

it('preserves narrow loader arguments and returns their values without envelope changes', async () => {
  queries.getCurrentMarketListings.mockResolvedValue([{ player_id: 7 }]);
  expect(await fetchCurrentMarketListings()).toEqual([{ player_id: 7 }]);
  await fetchLiveMarketTransfers();
  await fetchLiveMarketTransfers({ page: 2, limit: 3, buyer: 'A' });
  expect(queries.getLiveMarketTransfers.mock.calls).toEqual([
    [{}],
    [{ page: 2, limit: 3, buyer: 'A' }],
  ]);
  await fetchMarketTrendsAnalysis(7);
  expect(queries.getMarketTrendsAnalysis).toHaveBeenCalledExactlyOnceWith(7);
  await fetchBestValueDetails(0);
  expect(queries.getBestValueDetails).toHaveBeenCalledExactlyOnceWith(0);
  await fetchBiddingDuelDetails(7, 8);
  expect(queries.getBiddingDuelDetails).toHaveBeenCalledExactlyOnceWith(7, 8);
});
