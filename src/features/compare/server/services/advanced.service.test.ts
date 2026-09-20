import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createCompareAdvancedService } from './advanced.service';
const names = [
  'fetchStreakStats',
  'fetchHeatCheckStats',
  'fetchHunterStats',
  'fetchBottlerStats',
  'fetchHeartbreakerStats',
  'fetchNoGloryStats',
  'fetchJinxStats',
  'fetchFloorCeilingStats',
  'fetchVolatilityStats',
  'fetchEfficiencyStats',
  'fetchDominanceStats',
  'fetchReliabilityStats',
  'fetchTheoreticalGapStats',
  'fetchRivalryMatrixStats',
  'fetchLeagueComparisonStats',
  'getManagerMarketStats',
  'getBestSeller',
  'getBiddingDuelsStats',
  'getTheThief',
] as const;
function dependencies() {
  // Synthetic trusted dependency results exercise every wiring slot, not a database.
  const deps = Object.fromEntries(
    names.map((name) => [name, vi.fn(async (): Promise<unknown> => [])])
  );
  deps.fetchRivalryMatrixStats.mockResolvedValue({
    matrix: { '1': { '2': { wins: 1, losses: 2, ties: 3 } } },
  });
  deps.getBiddingDuelsStats.mockResolvedValue({
    users: [],
    matrix: {},
    hottestRivalry: null,
    biggestDominance: null,
  });
  return deps as unknown as NonNullable<Parameters<typeof createCompareAdvancedService>[0]>;
}
it('reads all nineteen upstream contracts and preserves matrix versus envelope shapes', async () => {
  const deps = dependencies();
  const result = await createCompareAdvancedService(deps)();
  for (const name of names) expect(deps[name]).toHaveBeenCalledExactlyOnceWith();
  expect(Object.keys(result)).toHaveLength(19);
  expect(result.rivalryMatrix).toEqual({ '1': { '2': { wins: 1, losses: 2, ties: 3 } } });
  expect(result.biddingDuels).toEqual({
    users: [],
    matrix: {},
    hottestRivalry: null,
    biggestDominance: null,
  });
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});
it('propagates upstream advanced failure without returning a partial success', async () => {
  const deps = dependencies();
  vi.mocked(deps.getTheThief).mockRejectedValue(new Error('fixture failure'));
  await expect(createCompareAdvancedService(deps)()).rejects.toThrow('fixture failure');
});
