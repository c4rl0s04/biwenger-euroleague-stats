import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/players/server', () => ({ getPlayerRecentScores: vi.fn() }));
vi.mock('@/features/standings/server', () => ({ getSimpleStandings: vi.fn() }));
vi.mock('../queries/manager-stats.query', () => ({ readManagerSeasonStats: vi.fn() }));
vi.mock('../queries/manager-squad.query', () => ({
  readManagerSquad: vi.fn(),
  readManagerPoints: vi.fn(),
}));
vi.mock('../queries/manager-rounds.query', () => ({ readManagerRounds: vi.fn() }));
import { createManagerReadService, MANAGERS_READ_POLICY } from './manager-read.service';

function fixture() {
  const calls: string[] = [];
  const deps = {
    readStats: vi.fn(async () => {
      calls.push('stats');
      return { transfers: { purchases: 0, sales: 0, total_spent: 0, total_received: 0 } };
    }),
    readSquad: vi.fn(async () => {
      calls.push('squad');
      return { seasonId: '2026-27', rows: [] };
    }),
    readForm: vi.fn(async () => {
      calls.push('form');
      return [];
    }),
    readPoints: vi.fn(async () => {
      calls.push('points');
      return '0';
    }),
    readStandings: vi.fn(async () => {
      calls.push('standings');
      return [{ user_id: '7', position: 2, team_value: '100', price_trend: 3 }];
    }),
    readRounds: vi.fn(async () => ({ rounds: [], total_played: 0, total_rounds: 0 })),
  };
  return { deps, calls, service: createManagerReadService(deps) };
}
describe('Managers read orchestration', () => {
  it('preserves sequential squad/form/points/standings reads and the same season for points', async () => {
    const { service, deps, calls } = fixture();
    expect(await service.getManagerSquadData('7')).toMatchObject({
      total_points: '0',
      position: 2,
      players: [],
    });
    expect(calls).toEqual(['squad', 'form', 'points', 'standings']);
    expect(deps.readForm).toHaveBeenCalledWith(5);
    expect(deps.readPoints).toHaveBeenCalledWith('7', '2026-27');
  });
  it('does not cache across repeated reads', async () => {
    const { service, deps } = fixture();
    await service.getManagerSeasonStatsData(7);
    await service.getManagerSeasonStatsData(7);
    expect(deps.readStats).toHaveBeenCalledTimes(2);
    expect(deps.readStandings).toHaveBeenCalledTimes(2);
    expect(MANAGERS_READ_POLICY.httpCache).toBe('private, no-store, max-age=0, must-revalidate');
  });
  it('preserves caller identity rather than tightening malformed page inputs', async () => {
    const { service, deps } = fixture();
    await service.getManagerSeasonStatsData('7abc');
    expect(deps.readStats).toHaveBeenCalledWith('7abc');
    await service.getManagerRoundsData(7);
    expect(deps.readRounds).toHaveBeenCalledWith('7', 100);
  });
  it('preserves thrown error identity and stops downstream reads', async () => {
    const { service, deps } = fixture();
    const error = new Error('fixture failure');
    deps.readSquad.mockRejectedValue(error);
    await expect(service.getManagerSquadData('7')).rejects.toBe(error);
    expect(deps.readForm).not.toHaveBeenCalled();
  });
});
