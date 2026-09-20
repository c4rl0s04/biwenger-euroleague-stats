import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/rounds/server', () => ({ resolveRoundIdByPolicy: vi.fn() }));
vi.mock('@/features/managers/server', () => ({
  getManagerDirectory: vi.fn(),
  getOwnedPlayers: vi.fn(),
}));
vi.mock('@/features/matches/server', () => ({
  getScheduleRoundOptions: vi.fn(),
  findScheduleRound: vi.fn(),
  getLatestDatedScheduleRound: vi.fn(),
  getScheduleFixtures: vi.fn(),
  getMatchesScreenData: vi.fn(),
}));
import { createScheduleService, SCHEDULE_READ_POLICY } from './schedule.service';
import { mapScheduleMatches, mapSchedulePlayer } from '../mappers/schedule.mapper';
import { parseScheduleRoundId } from '../../validation/schedule-input';
import type { OwnedPlayer } from '@/features/managers/public';
import type { ScheduleFixture } from '@/features/matches/public';

const round = { roundId: 7, roundName: 'Jornada 7' };
const fixture: ScheduleFixture = {
  id: 1,
  date: '2025-10-01T18:00:00.000Z',
  homeId: 1,
  awayId: 2,
  homeName: 'Home',
  awayName: 'Away',
  homeCode: 'MAD',
  awayCode: 'BAR',
};
const player: OwnedPlayer = {
  id: 10,
  name: 'Player',
  teamId: 1,
  teamName: 'Home',
  teamCode: 'MAD',
  position: 'Base',
  price: 100,
  imageUrl: null,
  points: 20,
};
function setup() {
  const deps = {
    resolveRoundIdByPolicy: vi.fn(async () => 7),
    getManagerDirectory: vi.fn(async () => []),
    getOwnedPlayers: vi.fn(async () => [player]),
    getScheduleRoundOptions: vi.fn(async () => [round]),
    findScheduleRound: vi.fn(async () => round as typeof round | null),
    getLatestDatedScheduleRound: vi.fn(async () => round as typeof round | null),
    getScheduleFixtures: vi.fn(async () => [fixture]),
    getMatchesScreenData: vi.fn(async () => ({
      rounds: [],
      currentRoundId: null,
      selectedRoundId: 7,
    })),
  };
  return { deps, service: createScheduleService(deps) };
}

describe('Schedule compatibility validation', () => {
  it.each([
    [undefined, null],
    ['', null],
    ['7abc', 7],
    ['7.9', 7],
    ['0x10', 16],
    [['7', '8'], 7],
    ['0', 0],
    ['-2', -2],
    [' 7 ', 7],
  ])('preserves parsing %j', (input, expected) => {
    expect(parseScheduleRoundId(input)).toBe(expected);
  });
  it('retains NaN for unparseable and empty repeated values', () => {
    expect(parseScheduleRoundId('no')).toBeNaN();
    expect(parseScheduleRoundId([])).toBeNaN();
  });
});

describe('Schedule read orchestration', () => {
  it.each([null, 0, NaN])('uses active policy for falsy round %s', async (value) => {
    const { deps, service } = setup();
    await service.getUserSchedule('0012', value);
    expect(deps.resolveRoundIdByPolicy).toHaveBeenCalledWith('active_or_next');
    expect(deps.findScheduleRound).toHaveBeenCalledWith(7);
    expect(deps.getOwnedPlayers).toHaveBeenCalledWith(12);
  });
  it('uses explicit rounds and falls back to the latest dated round, not the first option', async () => {
    const { deps, service } = setup();
    deps.findScheduleRound.mockResolvedValue(null);
    const result = await service.getUserSchedule('12', 999);
    expect(deps.resolveRoundIdByPolicy).not.toHaveBeenCalled();
    expect(deps.findScheduleRound).toHaveBeenCalledWith(999);
    expect(deps.getLatestDatedScheduleRound).toHaveBeenCalledOnce();
    expect(result.round?.round_id).toBe(7);
  });
  it('stops when no round exists', async () => {
    const { deps, service } = setup();
    deps.findScheduleRound.mockResolvedValue(null);
    deps.getLatestDatedScheduleRound.mockResolvedValue(null);
    expect(await service.getUserSchedule('12', 7)).toEqual({
      found: false,
      message: 'No upcoming rounds found.',
    });
    expect(deps.getOwnedPlayers).not.toHaveBeenCalled();
  });
  it('preserves empty-squad shape and omits fixtures and totals', async () => {
    const { deps, service } = setup();
    deps.getOwnedPlayers.mockResolvedValue([]);
    expect(await service.getUserSchedule('12', 7)).toEqual({
      found: true,
      round: { round_id: 7, round_name: 'Jornada 7' },
      matches: [],
      message: 'User has no players.',
    });
  });
  it('keeps the whole squad summary, with stable point ordering and per-match counts', async () => {
    const { deps, service } = setup();
    deps.getOwnedPlayers.mockResolvedValue([
      player,
      { ...player, id: 11, teamId: 99, points: 40 },
      { ...player, id: 12 },
    ]);
    const result = await service.getUserSchedule('12', 7);
    expect(result.found).toBe(true);
    if (!result.found) throw new Error('Expected schedule');
    expect(result.userPlayers?.map((p) => p.id)).toEqual([11, 10, 12]);
    expect(result.matches[0].user_players.map((p) => p.id)).toEqual([10, 12]);
    expect(result.total_players).toBe(2);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
  it('does not memoize personal data across calls or users', async () => {
    const { deps, service } = setup();
    await service.getUserSchedule('12', 7);
    deps.getOwnedPlayers.mockResolvedValue([]);
    expect((await service.getUserSchedule('13', 7)).matches).toEqual([]);
    expect(deps.getOwnedPlayers.mock.calls).toEqual([[12], [13]]);
    expect(SCHEDULE_READ_POLICY.serverCache).toContain('none');
  });
  it.each([new Error('fixture read failed'), { message: 'fixture read failed' }])(
    'preserves rendered errors without logging raw error details (%j)',
    async (error) => {
      const { deps, service } = setup();
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      deps.getOwnedPlayers.mockRejectedValue(error);
      expect(await service.getUserSchedule('12', 7)).toEqual({
        found: false,
        message: 'fixture read failed',
      });
      expect(log).toHaveBeenCalledWith('Error in getUserScheduleService');
      log.mockRestore();
    }
  );
  it('keeps reference-data failures outside the rendered schedule-error result', async () => {
    const { deps, service } = setup();
    deps.getManagerDirectory.mockRejectedValue(new Error('directory failed'));
    await expect(service.getScheduleReferenceData()).rejects.toThrow('directory failed');
  });
  it('delegates raw map input to Matches and preserves resolved back navigation', async () => {
    const { deps, service } = setup();
    expect(await service.getScheduleMapData(['7abc', '8'])).toEqual({
      matches: [],
      backHref: '/schedule?roundId=7',
    });
    expect(deps.getMatchesScreenData).toHaveBeenCalledWith(['7abc', '8']);
  });
});

describe('Schedule mapping', () => {
  it('allowlists owned-player fields and preserves nulls', () => {
    const source = { ...player, secret: 'must not escape' };
    expect(mapSchedulePlayer(source)).toEqual({
      id: 10,
      name: 'Player',
      team_id: 1,
      team_name: 'Home',
      team_code: 'MAD',
      position: 'Base',
      price: 100,
      img: null,
      puntos: 20,
    });
  });
  it('preserves away ownership, nullable match names and legacy null-team comparisons', () => {
    const result = mapScheduleMatches(
      [{ ...fixture, homeId: null, homeName: null }],
      [mapSchedulePlayer({ ...player, teamId: null })]
    );
    expect(result[0].user_players[0].is_home).toBe(true);
    expect(result[0].listItem.home).toEqual({ id: 0, name: 'Local', score: null });
    const away = mapScheduleMatches([fixture], [mapSchedulePlayer({ ...player, teamId: 2 })]);
    expect(away[0].user_players[0]).toMatchObject({ is_home: false, opponent: 'Home' });
  });
});
