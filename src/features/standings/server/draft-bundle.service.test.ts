import { beforeEach, expect, it, vi } from 'vitest';
import { fetchInitialSquadStats } from './services/draft.service';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ detailed: vi.fn() }));
vi.mock('./queries/draft.query', () => ({
  getInitialSquadActualPerformance: vi.fn(),
  getBestInitialSquadPlayer: async () => [],
  getInitialSquadRetainedPoints: async () => [],
  getInitialSquadRetainedBreakdown: async () => [],
  getInitialSquadRegret: async () => [],
  getInitialSquadLoyalty: async () => [],
  getInitialSquadPotentialAdvanced: async () => [],
  getInitialSquadsDetailed: mocks.detailed,
}));

beforeEach(() => {
  mocks.detailed.mockReset();
});

it.each([null, undefined])('preserves the detailed-only legacy fallback for %s', async (value) => {
  mocks.detailed.mockResolvedValue(value);
  expect(await fetchInitialSquadStats()).toEqual({
    bestDraftPerUser: [],
    retainedRanking: [],
    retainedBreakdown: [],
    regretRanking: [],
    loyaltyRanking: [],
    potentialRanking: [],
    detailedSquads: [],
  });
});

it('does not swallow a detailed query rejection', async () => {
  const error = new Error('synthetic read failure');
  mocks.detailed.mockRejectedValue(error);
  await expect(fetchInitialSquadStats()).rejects.toBe(error);
});
