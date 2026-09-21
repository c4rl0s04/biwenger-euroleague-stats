import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createLastRoundService } from './last-round.service';

it('maps only the legacy fields, preserving nulls, order, limits and uncached reads', async () => {
  const player = {
    player_id: 7,
    name: null,
    team: null,
    position: null,
    points: null,
    owner_name: null,
    token: 'excluded',
  };
  const deps = {
    mvps: vi.fn().mockResolvedValue([{ ...player, owner_color_index: null }]),
    stats: vi.fn().mockResolvedValue([{ ...player, price: null, round_name: null }]),
    highest: vi.fn().mockResolvedValue({
      seasonId: 'season-A',
      record: { user_name: null, round_name: null, points: null, token: 'excluded' },
    }),
  };
  const service = createLastRoundService(deps);
  expect(await service.getLastRoundMVPs()).toEqual([
    {
      player_id: 7,
      name: null,
      team: null,
      position: null,
      points: null,
      owner_name: null,
      owner_color_index: null,
    },
  ]);
  await service.getLastRoundMVPs(3);
  expect(deps.mvps.mock.calls).toEqual([[5], [3]]);
  expect(await service.getLastRoundStats()).toEqual([
    {
      player_id: 7,
      name: null,
      team: null,
      position: null,
      points: null,
      owner_name: null,
      price: null,
      round_name: null,
    },
  ]);
  expect(await service.getHighestRoundSnapshot()).toEqual({
    seasonId: 'season-A',
    record: { user_name: null, round_name: null, points: null },
  });
  deps.highest.mockResolvedValue({ seasonId: 'season-A', record: null });
  expect((await service.getHighestRoundSnapshot()).record).toBeNull();
  deps.mvps.mockRejectedValueOnce(new Error('query failure'));
  await expect(service.getLastRoundMVPs()).rejects.toThrow('query failure');
});
