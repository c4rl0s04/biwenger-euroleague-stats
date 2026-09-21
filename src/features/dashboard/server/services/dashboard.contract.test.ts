import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createPersonalDashboardService } from './personal.service';
import { createNextRoundDashboardService } from './next-round.service';
import { createLeagueDashboardService } from './league.service';
import { createDashboardActivityService } from './activity.service';

describe('Dashboard orchestration contracts', () => {
  it('uses owning manager services, preserves ID strings and never memoizes personal reads', async () => {
    const deps = {
      season: vi.fn().mockResolvedValue({ id: '7' }),
      squad: vi.fn().mockResolvedValue({ player_count: 2 }),
      captain: vi.fn().mockResolvedValue({ extra_points: 4 }),
      homeAway: vi.fn().mockResolvedValue({ avg_home: 3 }),
      alerts: vi.fn().mockResolvedValue([]),
      leader: vi.fn().mockResolvedValue(null),
    };
    const service = createPersonalDashboardService(deps);
    expect(await service('')).toEqual({ error: 'User ID required' });
    expect(deps.season).not.toHaveBeenCalled();
    const result = await service('007');
    expect(result).toEqual({
      seasonStats: { id: '7' },
      squadDetails: { player_count: 2 },
      captainStats: { extra_points: 4 },
      homeAwayStats: { avg_home: 3 },
      alerts: [],
      leaderGap: null,
    });
    await service('007');
    expect(deps.season.mock.calls).toEqual([['007'], ['007']]);
    expect(deps.alerts.mock.calls).toEqual([
      ['007', 5],
      ['007', 5],
    ]);
    expect(deps.leader).toHaveBeenCalledWith('007');
    deps.squad.mockRejectedValueOnce(new Error('squad failure'));
    await expect(service('7')).rejects.toThrow('squad failure');
  });

  function nextDependencies() {
    return {
      select: vi.fn().mockResolvedValue(9),
      calendar: vi.fn().mockResolvedValue({
        currentRound: {
          roundId: 9,
          roundName: 'J9',
          startDate: null,
          endDate: null,
          totalMatches: 1,
          finishedMatches: 0,
          matches: [],
          status: 'upcoming',
        },
        nextRound: null,
      }),
      details: vi.fn().mockResolvedValue({
        round_id: 9,
        round_name: 'J9',
        start_date: null,
        end_date: null,
        matches: [],
      }),
      form: vi.fn().mockResolvedValue([]),
      captains: vi.fn().mockResolvedValue([]),
      market: vi.fn().mockResolvedValue([]),
    };
  }
  it('selects the calendar policy before preparation and retains the separate calendar snapshot', async () => {
    const deps = nextDependencies();
    const service = createNextRoundDashboardService(deps);
    const result = await service.getNextRoundData('007');
    expect(deps.select).toHaveBeenCalledWith('active_or_next');
    expect(deps.select.mock.invocationCallOrder[0]).toBeLessThan(
      deps.calendar.mock.invocationCallOrder[0]
    );
    expect(deps.form).toHaveBeenCalledWith(6, 3);
    expect(deps.captains).toHaveBeenCalledWith('007', 6);
    expect(deps.market).toHaveBeenCalledWith(6);
    expect(deps.details).toHaveBeenCalledWith(9);
    expect(result.currentRoundStatus).toEqual({
      round_id: 9,
      round_name: 'J9',
      start_date: null,
      end_date: null,
      total_matches: 1,
      finished_matches: 0,
      matches: [],
      status_calc: 'upcoming',
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    await service.getNextRoundData('007');
    expect(deps.select).toHaveBeenCalledTimes(2);
    deps.select.mockRejectedValueOnce(new Error('calendar failure'));
    await expect(service.getNextRoundData()).rejects.toThrow('calendar failure');
    expect(deps.calendar).toHaveBeenCalledTimes(2);
  });
  it.each([null, 0, ''])('does not request personalized recommendations for %s', async (userId) => {
    const deps = nextDependencies();
    deps.select.mockResolvedValue(null);
    const service = createNextRoundDashboardService(deps);
    expect((await service.getNextRoundData(userId)).nextRound).toBeNull();
    expect(deps.captains).not.toHaveBeenCalled();
    expect(deps.details).not.toHaveBeenCalled();
    expect(await service.fetchNextRound()).toBeNull();
  });
  it('the public next-round widget reads only selected fixtures', async () => {
    const deps = nextDependencies();
    const service = createNextRoundDashboardService(deps);
    expect(await service.fetchNextRound()).toEqual(await deps.details.mock.results[0].value);
    expect(deps.calendar).not.toHaveBeenCalled();
    expect(deps.captains).not.toHaveBeenCalled();
  });

  function leagueDependencies() {
    return {
      streaks: vi.fn().mockResolvedValue([{ user_id: '7', current_streak: 2 }]),
      average: vi.fn().mockResolvedValue(null),
      mvps: vi.fn().mockResolvedValue([]),
      birthdays: vi.fn().mockResolvedValue([]),
      stats: vi.fn().mockResolvedValue([]),
    };
  }
  it('preserves the existing empty hot/cold widgets instead of replacing manager streaks with player streaks', async () => {
    const deps = leagueDependencies();
    const service = createLeagueDashboardService(deps);
    expect(await service.getLeagueDashboardData()).toEqual({
      leagueAverage: null,
      roundMVPs: [],
      upcomingBirthdays: [],
      hotStreaks: [],
      coldStreaks: [],
    });
    expect(deps.mvps).toHaveBeenCalledWith(5);
    expect(await service.getStreakData('hot')).toEqual([]);
    expect(await service.getStreakData('cold', 3)).toEqual([]);
    expect(deps.streaks).toHaveBeenCalledTimes(3);
    deps.streaks.mockRejectedValueOnce(new Error('streak failure'));
    await expect(service.getLeagueDashboardData()).rejects.toThrow('streak failure');
  });
  it('selects ideal-lineup TTL from input availability, even if no player is eligible', async () => {
    const deps = leagueDependencies();
    const service = createLeagueDashboardService(deps);
    expect(await service.getDashboardIdealLineup()).toEqual({
      data: { lineup: [], total_points: 0, round_name: '-' },
      cacheSeconds: 60,
    });
    deps.stats.mockResolvedValue([{ position: '__proto__', round_name: 'J1' }]);
    expect(await service.getDashboardIdealLineup()).toEqual({
      data: { lineup: [], total_points: 0, round_name: 'J1' },
      cacheSeconds: 300,
    });
  });

  function activityDependencies() {
    return {
      round: vi.fn().mockResolvedValue({ seasonId: 'season-A', record: null }),
      transfer: vi.fn().mockResolvedValue(null),
      gain: vi.fn().mockResolvedValue(null),
      transfers: vi.fn().mockResolvedValue([]),
      prices: vi.fn().mockResolvedValue([]),
      alerts: vi.fn().mockResolvedValue([]),
    };
  }
  it('preserves limits, thresholds, optional manager alerts and sequential single-season record reads', async () => {
    const deps = activityDependencies();
    const service = createDashboardActivityService(deps);
    expect(await service.getRecentActivityData()).toEqual({
      recentTransfers: [],
      priceChanges: [],
      recentRecords: [],
      personalizedAlerts: [],
    });
    expect(deps.alerts).not.toHaveBeenCalled();
    expect(deps.transfers).toHaveBeenCalledWith(8);
    expect(deps.prices).toHaveBeenCalledWith(24, 500000);
    expect(deps.transfer).toHaveBeenCalledWith('season-A');
    expect(deps.gain).toHaveBeenCalledWith('season-A');
    expect(deps.round.mock.invocationCallOrder[0]).toBeLessThan(
      deps.transfer.mock.invocationCallOrder[0]
    );
    expect(deps.transfer.mock.invocationCallOrder[0]).toBeLessThan(
      deps.gain.mock.invocationCallOrder[0]
    );
    await service.getRecentActivityData('007');
    expect(deps.alerts).toHaveBeenCalledWith('007', 5);
    expect(deps.round).toHaveBeenCalledTimes(2);
    deps.transfer.mockRejectedValueOnce(new Error('record failure'));
    await expect(service.getRecentRecords()).rejects.toThrow('record failure');
    expect(deps.gain).toHaveBeenCalledTimes(2);
  });
});
