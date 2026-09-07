import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('./round-list.service', () => ({ fetchRoundsList: vi.fn() }));
vi.mock('./round-results.service', () => ({
  fetchRoundCompleteData: vi.fn(),
  fetchRoundStandings: vi.fn(),
}));
vi.mock('./round-history.service', () => ({ getUserPerformanceHistoryService: vi.fn() }));
import { createRoundScreenService, type RoundScreenDependencies } from './round-screen.service';

function fixture() {
  const order: string[] = [];
  const call = (key: string, value: unknown) =>
    vi.fn(async () => {
      order.push(key);
      return value;
    });
  const deps = {
    lists: call('lists', {
      rounds: [{ round_id: 1, round_name: 'Jornada 1' }],
      users: [],
      defaultRoundId: 1,
    }),
    complete: call('complete', {
      users: [{ id: '7', points: 24, ideal_points: 30 }],
      idealLineup: [],
      global: null,
    }),
    standings: call('standings', [{ id: '8', name: 'Rival', points: 40 }]),
    history: call('history', [{ round_name: 'Jornada 1', actual_points: 24 }]),
  };
  return {
    deps,
    order,
    service: createRoundScreenService(deps as unknown as RoundScreenDependencies),
  };
}
describe('Rounds screen orchestration compatibility', () => {
  it.each(['007abc', '0', '-2', 'null'])(
    'forwards nonempty round string %s without tightening validation',
    async (round) => {
      const { service, deps, order } = fixture();
      await service.getRoundOverviewData('7', round);
      expect(order).toEqual(['lists', 'complete']);
      expect(deps.complete).toHaveBeenCalledWith(round, '7');
    }
  );
  it('retains nullish default and truthy loading decisions', async () => {
    const { service, deps } = fixture();
    await service.getRoundOverviewData('7', '');
    await service.getRoundOverviewData(undefined, 1);
    expect(deps.complete).not.toHaveBeenCalled();
    await service.getRoundOverviewData('7');
    expect(deps.complete).toHaveBeenCalledWith(1, '7');
  });
  it('history still performs complete read first and keeps display without actual_points', async () => {
    const { service, order } = fixture();
    expect(await service.getRoundSectionData('1', 'history', '7')).toEqual({
      points: 24,
      ideal: 30,
      rows: [{ key: '0', index: 1, title: 'Jornada 1' }],
    });
    expect(order).toEqual(['complete', 'history']);
  });
  it('anonymous comparison still reads standings, while anonymous history performs no reads', async () => {
    const { service, order } = fixture();
    await service.getRoundSectionData('1', 'history');
    expect(order).toEqual([]);
    expect((await service.getRoundSectionData('1', 'comparison')).rows[0].title).toBe('Rival');
    expect(order).toEqual(['standings']);
  });
  it('does not memoize and propagates underlying failure identity', async () => {
    const { service, deps } = fixture();
    await service.getRoundOverviewData('7');
    await service.getRoundOverviewData('7');
    expect(deps.lists).toHaveBeenCalledTimes(2);
    const error = new Error('fixture');
    deps.complete.mockRejectedValue(error);
    await expect(service.getRoundSectionData('1', 'history', '7')).rejects.toBe(error);
    expect(deps.history).not.toHaveBeenCalled();
  });
});
