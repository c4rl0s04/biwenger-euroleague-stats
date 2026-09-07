import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/manager-contributors.query', () => ({ readManagerContributors: vi.fn() }));
import {
  createManagerContributorsService,
  MANAGER_CONTRIBUTORS_POLICY,
} from './manager-contributors.service';

describe('manager contributors orchestration', () => {
  it('maps without sorting, limits or identity coercion', async () => {
    const read = vi.fn(async () =>
      [2, 1].map((id) => ({
        player_id: id,
        player_name: null,
        player_img: null,
        total_base_points: '10',
        total_contribution: '10',
        games_played: '1',
      }))
    );
    const service = createManagerContributorsService(read);
    const result = await service('007abc');
    expect(read).toHaveBeenCalledWith('007abc');
    expect(result.map((row) => row.player_id)).toEqual([2, 1]);
    expect(result[0].total_contribution).toBe(10);
  });
  it('preserves empty and repeated reads, without cache', async () => {
    const read = vi.fn(async () => []);
    const service = createManagerContributorsService(read);
    expect(await service('7')).toEqual([]);
    await service('7');
    expect(read).toHaveBeenCalledTimes(2);
    expect(MANAGER_CONTRIBUTORS_POLICY.serverCache).toBe('none');
  });
  it('propagates dependency failure identity', async () => {
    const error = new Error('fixture failure');
    const service = createManagerContributorsService(vi.fn().mockRejectedValue(error));
    await expect(service('7')).rejects.toBe(error);
  });
});
