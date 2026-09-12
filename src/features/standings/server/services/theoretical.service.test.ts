import { beforeEach, expect, it, vi } from 'vitest';
import { fetchTheoreticalStandings } from './theoretical.service';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ directory: vi.fn(), history: vi.fn() }));
vi.mock('../queries/manager-directory.query', () => ({ queryStandingsManagers: mocks.directory }));
vi.mock('../queries/theoretical.query', () => ({}));
vi.mock('@/features/rounds/server', () => ({ getUserPerformanceHistoryService: mocks.history }));

beforeEach(() => {
  mocks.directory.mockReset();
  mocks.history.mockReset();
});

it('reads exactly the directory managers and preserves Rounds aggregation, nulls and tie order', async () => {
  mocks.directory.mockResolvedValue([
    { id: '007', name: null, icon: '', color_index: 0 },
    { id: 'manager-x', name: 'X', icon: null, color_index: 2 },
  ]);
  mocks.history.mockResolvedValueOnce([
    { actual_points: -2, ideal_points: 5 },
    { actual_points: 3, ideal_points: null },
  ]);
  mocks.history.mockResolvedValueOnce([{ actual_points: 2, ideal_points: 5 }]);
  expect(await fetchTheoreticalStandings()).toEqual([
    {
      user_id: '007',
      name: null,
      icon: '',
      color_index: 0,
      total_actual: 1,
      total_ideal: 5,
      gap: 4,
      efficiency: 20,
      rounds_played: 2,
    },
    {
      user_id: 'manager-x',
      name: 'X',
      icon: null,
      color_index: 2,
      total_actual: 2,
      total_ideal: 5,
      gap: 3,
      efficiency: 40,
      rounds_played: 1,
    },
  ]);
  expect(mocks.history.mock.calls).toEqual([['007'], ['manager-x']]);
});

it('does not substitute full standings for an empty directory', async () => {
  mocks.directory.mockResolvedValue([]);
  expect(await fetchTheoreticalStandings()).toEqual([]);
  expect(mocks.history).not.toHaveBeenCalled();
});

it('propagates history failure without partial success', async () => {
  mocks.directory.mockResolvedValue([{ id: '007' }]);
  const error = new Error('synthetic history failure');
  mocks.history.mockRejectedValue(error);
  await expect(fetchTheoreticalStandings()).rejects.toBe(error);
});
