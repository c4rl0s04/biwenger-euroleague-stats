import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/matches/server', () => ({ getSeasonScheduleData: vi.fn() }));
vi.mock('../queries/team-profile.query', () => ({
  findTeamProfileDetails: vi.fn(),
  listTeamRoster: vi.fn(),
}));

import type { MatchScheduleViewModel } from '@/features/matches/public';

import {
  createTeamProfileService,
  TEAM_PROFILE_ACCESS_POLICY,
  TEAM_PROFILE_HTTP_CACHE_SECONDS,
} from './team-profile.service';

describe('team profile service', () => {
  const findDetails = vi.fn();
  const listRoster = vi.fn();
  const getSeasonSchedule = vi.fn();
  const service = createTeamProfileService({
    findDetails,
    listRoster,
    getSeasonSchedule,
    now: () => new Date('2026-09-02T12:00:00.000Z'),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    findDetails.mockResolvedValue({
      row: {
        id: 7,
        name: 'Madrid',
        short_name: 'MAD',
        logo: '/madrid.png',
        total_fantasy_points: 10,
        total_real_points: 20,
        avg_pir: 30,
        total_value: 40,
        roster_size: 0,
        wins: 2,
        losses: 1,
      },
      matchesPlayed: 3,
      playoffProbability: 75,
      rank: 4,
    });
    listRoster.mockResolvedValue([]);
    getSeasonSchedule.mockResolvedValue([] satisfies MatchScheduleViewModel[]);
  });

  it('declares public read-only access and the existing five-minute HTTP cache policy', () => {
    expect(TEAM_PROFILE_ACCESS_POLICY).toEqual({ read: 'public', mutations: 'none' });
    expect(TEAM_PROFILE_HTTP_CACHE_SECONDS).toBe(300);
  });

  it('orchestrates Team queries and the Matches server contract in parallel-safe inputs', async () => {
    await expect(service.getTeamProfileData('7')).resolves.toMatchObject({
      id: 7,
      shortName: 'MAD',
      metrics: { matchesPlayed: 3, playoffProbability: 75 },
      roster: [],
      upcomingMatches: [],
      recentMatches: [],
    });
    expect(findDetails).toHaveBeenCalledWith(7);
    expect(listRoster).toHaveBeenCalledWith(7);
    expect(getSeasonSchedule).toHaveBeenCalledOnce();
  });

  it('rejects invalid identifiers before any query and preserves not-found behavior', async () => {
    await expect(service.getTeamProfileData('invalid')).resolves.toBeNull();
    expect(findDetails).not.toHaveBeenCalled();
    expect(listRoster).not.toHaveBeenCalled();
    expect(getSeasonSchedule).not.toHaveBeenCalled();

    findDetails.mockResolvedValueOnce(null);
    await expect(service.getTeamProfileData('999')).resolves.toBeNull();
  });
});
