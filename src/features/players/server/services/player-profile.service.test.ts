import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/features/teams/server', () => ({
  getTeamProfileMetricsData: vi.fn(),
  getTeamProfileUpcomingMatchesData: vi.fn(),
}));
vi.mock('../queries/player.query', () => ({ getPlayerDetails: vi.fn() }));

import type { PlayerDetailsQueryResult } from '../queries/player.query';
import { createPlayerProfileService } from './player-profile.service';

describe('player profile service', () => {
  const findPlayer = vi.fn();
  const getTeamMetrics = vi.fn();
  const getUpcomingMatches = vi.fn();
  const service = createPlayerProfileService({ findPlayer, getTeamMetrics, getUpcomingMatches });

  beforeEach(() => {
    vi.clearAllMocks();
    findPlayer.mockResolvedValue({
      player: { id: 7, name: 'Player', team_id: 2 },
      recentMatches: [],
      priceHistory: [],
      transfers: [],
      playerTotalMatches: 0,
    } as unknown as PlayerDetailsQueryResult);
    getTeamMetrics.mockResolvedValue(null);
    getUpcomingMatches.mockResolvedValue([]);
  });

  it('preserves legacy malformed-ID behavior before querying', async () => {
    await expect(service.getPlayerProfileData('7abc')).resolves.toBeNull();
    expect(findPlayer).not.toHaveBeenCalled();

    await service.getPlayerProfileData('1e2');
    expect(findPlayer).toHaveBeenCalledWith(100);
  });

  it('orchestrates Player queries through deliberate Team contracts', async () => {
    await expect(service.getPlayerProfileData('7')).resolves.toMatchObject({
      id: 7,
      name: 'Player',
      team_id: 2,
      recentMatches: [],
      nextMatches: [],
    });
    expect(getTeamMetrics).toHaveBeenCalledWith(2);
    expect(getUpcomingMatches).toHaveBeenCalledWith(2);
  });

  it('preserves not-found behavior without cross-feature reads', async () => {
    findPlayer.mockResolvedValueOnce(null);
    await expect(service.getPlayerProfileData('999')).resolves.toBeNull();
    expect(getTeamMetrics).not.toHaveBeenCalled();
    expect(getUpcomingMatches).not.toHaveBeenCalled();
  });

  it('uses the same read orchestration for the legacy HTTP projection', async () => {
    findPlayer.mockResolvedValue({
      player: {
        id: 7,
        name: 'Player',
        team_id: 2,
        games_played: '0',
        season_avg: null,
        total_points: null,
      },
      recentMatches: [],
      priceHistory: [],
      transfers: [],
      playerTotalMatches: 0,
    });
    await expect(service.getPlayerProfileApiData('7')).resolves.toMatchObject({
      id: 7,
      games_played: '0',
      season_avg: null,
      total_points: null,
    });
    expect(findPlayer).toHaveBeenCalledOnce();
    expect(getTeamMetrics).toHaveBeenCalledOnce();
    expect(getUpcomingMatches).toHaveBeenCalledOnce();
  });
});
