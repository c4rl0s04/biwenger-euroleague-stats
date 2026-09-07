import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/tournaments/server', () => ({ fetchUserTournaments: vi.fn() }));
vi.mock('./manager-read.service', () => ({
  getManagerSeasonStatsData: vi.fn(),
  getManagerSquadData: vi.fn(),
  getManagerRoundsData: vi.fn(),
}));
vi.mock('./manager-contributors.service', () => ({ getManagerContributorsData: vi.fn() }));
import {
  createManagerProfileService,
  MANAGER_PROFILE_POLICY,
  type ManagerProfileDependencies,
} from './manager-profile.service';

function fixture(name = 'Manager') {
  const order: string[] = [];
  const read = (key: string, data: unknown) =>
    vi.fn(async () => {
      order.push(key);
      return data;
    });
  const deps = {
    stats: read('stats', { name, last_transfers: [] }),
    squad: read('squad', { top_rising: [], players: [] }),
    rounds: read('rounds', { rounds: [] }),
    tournaments: read('tournaments', []),
    contributors: read('contributors', []),
  };
  return {
    deps,
    order,
    service: createManagerProfileService(deps as unknown as ManagerProfileDependencies),
  };
}

describe('Manager Profile orchestration contracts', () => {
  it('rejects a malformed desktop tournament phase only after the missing-manager check', async () => {
    const active = fixture();
    active.deps.tournaments.mockResolvedValue([{ phase_name: () => 'synthetic-private' }]);
    await expect(active.service.getManagerProfile('7', 'desktop')).rejects.toThrow(
      'Manager tournament phase is not serializable'
    );
    const missing = fixture('Desconocido');
    missing.deps.tournaments.mockResolvedValue([{ phase_name: () => 'synthetic-private' }]);
    expect(await missing.service.getManagerProfile('7', 'desktop')).toEqual({
      kind: 'missing',
      presentation: 'desktop',
    });
  });
  it('mobile competition projection ignores unused malformed phase as before', async () => {
    const { deps, service } = fixture();
    deps.tournaments.mockResolvedValue([
      { tournament_id: 1, phase_name: () => 'synthetic-private', points: 4 },
    ]);
    expect(await service.getManagerProfileSection('7', 'competitions')).toEqual({
      context: 'Manager',
      rows: [{ key: '0', index: 1, title: 'Registro 1', value: '4' }],
    });
  });
  it.each(['007abc', '0', '-1', 'undefined', '7'])(
    'forwards unchanged ID %s and reads only two phone dependencies',
    async (id) => {
      const { service, deps, order } = fixture();
      expect((await service.getManagerProfile(id, 'phone')).kind).toBe('phone');
      expect(order).toEqual(['stats', 'squad']);
      expect(deps.stats).toHaveBeenCalledWith(id);
      expect(deps.squad).toHaveBeenCalledWith(id);
    }
  );
  it('starts all five desktop reads before stats resolves, keeping rounds limit100', async () => {
    const { service, deps, order } = fixture();
    let release!: (value: unknown) => void;
    deps.stats.mockImplementation(() => {
      order.push('stats');
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const pending = service.getManagerProfile('007', 'desktop');
    expect(order).toEqual(['stats', 'squad', 'rounds', 'tournaments', 'contributors']);
    expect(deps.rounds).toHaveBeenCalledWith('007', 100);
    expect(deps.tournaments).toHaveBeenCalledWith('007');
    expect(deps.contributors).toHaveBeenCalledWith('007');
    release({ name: 'Manager' });
    expect((await pending).kind).toBe('desktop');
  });
  it.each(['phone', 'desktop'] as const)(
    'retains missing result after all %s reads',
    async (presentation) => {
      const { service, order } = fixture('Desconocido');
      expect(await service.getManagerProfile('7', presentation)).toEqual({
        kind: 'missing',
        presentation,
      });
      expect(order.length).toBe(presentation === 'phone' ? 2 : 5);
    }
  );
  it.each(['', 'Desconocido'])('retains missing name sentinel %s', async (name) => {
    expect((await fixture(name).service.getManagerProfile('7', 'desktop')).kind).toBe('missing');
  });
  it('does not cache repeated reads', async () => {
    const { service, deps } = fixture();
    await service.getManagerProfile('7', 'phone');
    await service.getManagerProfile('7', 'phone');
    expect(deps.stats).toHaveBeenCalledTimes(2);
    expect(MANAGER_PROFILE_POLICY.cache).toContain('no added cache');
  });
  it('propagates failure identity even when manager is missing', async () => {
    const { service, deps } = fixture('Desconocido');
    const failure = new Error('synthetic read failure');
    deps.squad.mockRejectedValue(failure);
    await expect(service.getManagerProfile('7', 'desktop')).rejects.toBe(failure);
  });
  it.each([
    ['season', undefined],
    ['squad', 'squad'],
    ['evolution', 'rounds'],
    ['contributors', 'contributors'],
    ['competitions', 'tournaments'],
    ['legacy-default', 'tournaments'],
  ])('section %s fetches stats first and only its selected read', async (section, selected) => {
    const { service, order, deps } = fixture('Desconocido');
    let release!: (value: unknown) => void;
    deps.stats.mockImplementation(() => {
      order.push('stats');
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const pending = service.getManagerProfileSection('007abc', section!);
    expect(order).toEqual(['stats']);
    release({ name: 'Desconocido', last_transfers: [] });
    expect(await pending).toEqual({ context: 'Desconocido', rows: [] });
    expect(order).toEqual(selected ? ['stats', selected] : ['stats']);
    expect(deps.stats).toHaveBeenCalledWith('007abc');
    if (selected === 'rounds') expect(deps.rounds).toHaveBeenCalledWith('007abc', 100);
  });
  it('section stops on stats failure before any additional read', async () => {
    const { service, deps } = fixture();
    const failure = new Error('synthetic failure');
    deps.stats.mockRejectedValue(failure);
    await expect(service.getManagerProfileSection('7', 'squad')).rejects.toBe(failure);
    expect(deps.squad).not.toHaveBeenCalled();
  });
});
