import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createLeagueComparisonService } from './league-comparison.service';
import type { SimpleStandingsEntry } from '../../models/base-standings';

const row = (id: string, points: number, position: number): SimpleStandingsEntry => ({
  user_id: id,
  name: `Manager ${id}`,
  icon: null,
  color_index: 0,
  total_points: points,
  team_value: '0',
  price_trend: 0,
  position,
});
it('preserves ranking gaps, tie positions, missing manager and string identity', async () => {
  const deps = {
    standings: vi.fn().mockResolvedValue([row('1', 100, 1), row('2', 85, 2)]),
    average: vi.fn().mockResolvedValue(null),
  };
  const service = createLeagueComparisonService(deps);
  expect(await service.getLeaderComparison(2)).toEqual({
    leader_name: 'Manager 1',
    leader_points: 100,
    user_points: 85,
    gap: 15,
    gap_to_second: 0,
    rounds_needed: 2,
    is_leader: false,
  });
  expect(await service.getLeaderComparison('1')).toMatchObject({
    gap: 0,
    gap_to_second: 15,
    rounds_needed: 0,
    is_leader: true,
  });
  expect(await service.getLeaderComparison('02')).toBeNull();
  deps.standings.mockResolvedValue([row('1', 100, 1), row('2', 100, 1)]);
  expect(await service.getLeaderComparison(2)).toMatchObject({
    gap: 0,
    gap_to_second: 0,
    is_leader: true,
  });
  deps.standings.mockResolvedValue([]);
  expect(await service.getLeaderComparison(1)).toBeNull();
  expect(await service.getLeagueAveragePoints()).toBeNull();
  deps.average.mockResolvedValue(0);
  expect(await service.getLeagueAveragePoints()).toBe(0);
  expect(deps.average).toHaveBeenCalledTimes(2);
  deps.standings.mockRejectedValueOnce(new Error('standings failure'));
  await expect(service.getLeaderComparison(1)).rejects.toThrow('standings failure');
});
