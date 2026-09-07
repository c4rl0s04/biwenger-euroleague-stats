import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/index', () => ({ db: {}, pgClient: {} }));
vi.mock('@/lib/db/connection', () => ({ db: {}, pgClient: {} }));
const query = vi.hoisted(() => ({
  resolveAllPlayAllSeason: vi.fn(),
  listAllPlayAllRounds: vi.fn(),
  listAllPlayAllUsers: vi.fn(),
  listAllPlayAllScores: vi.fn(),
}));
vi.mock('./queries/all-play-all.query', () => query);
import { cached, clearCache } from '@/lib/utils/cache';
import { getAllPlayAllStats } from '@/lib/db/queries/analytics/advanced_stats';
import { fetchAllPlayAllStats } from '@/features/standings/server';
import type { AllPlayAllComputedRecord } from './queries/all-play-all.records';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  clearCache();
  vi.clearAllMocks();
  query.resolveAllPlayAllSeason.mockResolvedValue('synthetic-shared');
  query.listAllPlayAllRounds.mockResolvedValue([]);
  query.listAllPlayAllUsers.mockResolvedValue([
    { id: '1', name: null, icon: null, color_index: 0 },
  ]);
});
afterEach(() => vi.restoreAllMocks());

it.each(['legacy-first', 'feature-first'])(
  'shares one unchanged raw cache across both contracts: %s',
  async (order) => {
    const calls =
      order === 'legacy-first'
        ? [getAllPlayAllStats, fetchAllPlayAllStats]
        : [fetchAllPlayAllStats, getAllPlayAllStats];
    const first = await calls[0]();
    const second = await calls[1]();
    const legacy = order === 'legacy-first' ? first : second;
    const feature = order === 'legacy-first' ? second : first;
    expect(Number.isNaN(legacy[0].pct)).toBe(true);
    expect(feature[0].pct).toBeNull();
    expect(JSON.stringify(legacy)).toBe(JSON.stringify(feature));
    expect(query.resolveAllPlayAllSeason).toHaveBeenCalledTimes(2);
    expect(query.listAllPlayAllRounds).toHaveBeenCalledTimes(1);
    expect(query.listAllPlayAllUsers).toHaveBeenCalledTimes(1);
    const unexpectedMiss = vi.fn(async (): Promise<AllPlayAllComputedRecord[]> => {
      throw new Error('unexpected cache miss');
    });
    const raw = await cached('advanced:all-play-all:synthetic-shared', 900, unexpectedMiss);
    expect(unexpectedMiss).not.toHaveBeenCalled();
    expect(Number.isNaN(raw[0].pct)).toBe(true);
  }
);
