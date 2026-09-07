import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/round-analysis.query', () => ({
  getAllRounds: vi.fn(),
  hasOfficialStats: vi.fn(),
  getOfficialStandings: vi.fn(),
  getLivingStandings: vi.fn(),
  getCoachRating: vi.fn(),
  getRoundGlobalStats: vi.fn(),
  getIdealLineup: vi.fn(),
  getUserLineup: vi.fn(),
  getPlayersLeftOut: vi.fn(),
  getUserOptimization: vi.fn(),
  getUserRoundsHistoryDAO: vi.fn(),
  getLineupUsageStats: vi.fn(),
}));
vi.mock('../queries/directory.query', () => ({ readManagerDirectory: vi.fn() }));
vi.mock('./calendar.service', () => ({
  getLastCompletedCalendarRound: vi.fn(),
  resolveRoundIdByPolicy: vi.fn(),
}));
import { createRoundResultsService } from './round-results.service';
import { createRoundHistoryService } from './round-history.service';
import { createRoundsListService } from './round-list.service';
import { createFormationUsageService } from './formation-usage.service';
import {
  manager,
  standing,
  globalStats,
  lineup,
  ideal,
  coach,
  historyRow,
} from './round-read.fixtures';

function resultsDeps() {
  return {
    official: vi.fn(async () => true),
    officialStandings: vi.fn(async () => [standing]),
    liveStandings: vi.fn(async () => [standing]),
    coach: vi.fn(async () => coach),
    global: vi.fn(async () => globalStats),
    ideal: vi.fn(async () => ideal),
    lineup: vi.fn(async () => lineup),
    leftOut: vi.fn(async () => []),
    optimization: vi.fn(async () => null),
  };
}
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
describe('Rounds result services', () => {
  it('keeps false/zero no-read branches and live/official choice without caching', async () => {
    const deps = resultsDeps();
    const service = createRoundResultsService(deps);
    expect(await service.fetchRoundStandings(0)).toEqual([]);
    expect(await service.fetchRoundCompleteData('')).toBeNull();
    expect(deps.official).not.toHaveBeenCalled();
    expect((await service.fetchRoundStandings('007abc'))[0]).toMatchObject({
      past_total: '66',
      participated: false,
      ideal_points: 40,
    });
    expect(deps.officialStandings).toHaveBeenCalledWith('007abc');
    deps.official.mockResolvedValue(false);
    await service.fetchRoundStandings('007abc');
    expect(deps.liveStandings).toHaveBeenCalledWith('007abc');
    expect(deps.official).toHaveBeenCalledTimes(2);
  });
  it('preserves per-manager rating failure rather than failing the standings', async () => {
    const deps = resultsDeps();
    deps.coach.mockRejectedValue(new Error('fixture failure'));
    const rows = await createRoundResultsService(deps).fetchRoundStandings(2);
    expect(rows[0].ideal_points).toBe(0);
  });
  it('quick mode keeps full global context, filter precedence and string matching', async () => {
    const deps = resultsDeps();
    deps.officialStandings.mockResolvedValue([standing, { ...standing, id: '8' }]);
    const result = await createRoundResultsService(deps).fetchRoundCompleteData(2, 7, 7);
    expect(result?.users.map((row) => row.id)).toEqual(['7']);
    expect(result?.globalIdealPoints).toBe(40);
    expect(deps.coach.mock.calls).toEqual([
      ['7', 2],
      ['8', 2],
      ['7', '2'],
    ]);
    expect(deps.lineup).toHaveBeenCalledWith('7', '2');
  });
  it('exclude mode and partial-detail failures retain standing-only managers', async () => {
    const deps = resultsDeps();
    deps.officialStandings.mockResolvedValue([standing, { ...standing, id: '8' }]);
    deps.lineup.mockRejectedValue(new Error('fixture failure'));
    const result = await createRoundResultsService(deps).fetchRoundCompleteData(2, undefined, 7);
    expect(result?.users).toEqual([{ ...standing, id: '8', ideal_points: 40 }]);
    expect(result?.users[0]).not.toHaveProperty('lineup');
  });
  it('legacy details retain the nested ideal object and omit undefined user ideal fields in JSON', async () => {
    const deps = resultsDeps();
    const result = await createRoundResultsService(deps).fetchUserRoundDetails('0');
    expect(result.idealLineup).toEqual(ideal);
    expect(JSON.parse(JSON.stringify(result.user))).toEqual({ coachRating: null, leftOut: [] });
    expect(deps.optimization).not.toHaveBeenCalled();
  });
  it('propagates global failures and maps direct lineups', async () => {
    const deps = resultsDeps();
    const service = createRoundResultsService(deps);
    expect(await service.fetchUserLineup(7, 2)).toEqual(lineup);
    const error = new Error('fixture failure');
    deps.global.mockRejectedValue(error);
    await expect(service.fetchRoundCompleteData(2)).rejects.toBe(error);
  });
});
describe('Rounds history services', () => {
  function deps() {
    return {
      history: vi.fn(async () => [historyRow]),
      coach: vi.fn(async () => coach),
      managers: vi.fn(async () => [manager]),
    };
  }
  it('preserves nonparticipation, name-number sorting/filtering and stored points', async () => {
    const reads = deps();
    reads.history.mockResolvedValue([
      { ...historyRow, round_name: 'Jornada 10 aplazada', actual_points: 12 },
      historyRow,
      { ...historyRow, round_name: 'Regular' },
    ]);
    const result =
      await createRoundHistoryService(reads).getUserPerformanceHistoryService('007abc');
    expect(result.map((r) => r.round_number)).toEqual([2, 10]);
    expect(result[0]).toMatchObject({ actual_points: 24, efficiency: 60, participated: false });
    expect(reads.history).toHaveBeenCalledWith('007abc');
    expect(reads.coach).toHaveBeenCalledTimes(3);
  });
  it('preserves zero maxScore fallback, caught failure efficiency and null-name failure', async () => {
    const reads = deps();
    reads.coach.mockResolvedValue({ ...coach, maxScore: 0 });
    const service = createRoundHistoryService(reads);
    expect((await service.getUserPerformanceHistoryService(7))[0].ideal_points).toBe(24);
    reads.coach.mockRejectedValue(new Error('fixture'));
    expect((await service.getUserPerformanceHistoryService(7))[0]).toMatchObject({
      ideal_points: 24,
      efficiency: 0,
    });
    reads.history.mockResolvedValue([{ ...historyRow, round_name: null }]);
    await expect(service.getUserPerformanceHistoryService(7)).rejects.toBeInstanceOf(TypeError);
  });
  it('keeps empty and per-manager leaderboard/history fallbacks', async () => {
    const reads = deps();
    reads.history.mockRejectedValue(new Error('fixture'));
    const service = createRoundHistoryService(reads);
    expect(await service.fetchAllUsersPerformanceHistory()).toEqual([{ userId: '7', history: [] }]);
    expect((await service.fetchRoundLeaderboard())[0]).toMatchObject({
      userId: '7',
      avgEfficiency: '0.0',
      roundsPlayed: 0,
      bestActualRound: null,
    });
    reads.managers.mockResolvedValue([]);
    expect(await service.fetchRoundLeaderboard()).toEqual([]);
    expect(await service.fetchAllUsersPerformanceHistory()).toEqual([]);
  });
  it('derives leaderboard stats from the same history without adding cache', async () => {
    const reads = deps();
    const service = createRoundHistoryService(reads);
    expect((await service.fetchRoundLeaderboard())[0]).toMatchObject({
      avgEfficiency: '60.0',
      totalLost: 16,
      bestActualRound: 2,
      roundsPlayed: 1,
    });
    await service.fetchAllUsersPerformanceHistory();
    expect(reads.history).toHaveBeenCalledTimes(2);
  });
});
describe('Rounds lists and formations', () => {
  it('retains discarded last-completed read, delayed policy and zero fallback', async () => {
    const calls: string[] = [];
    const service = createRoundsListService({
      rounds: async () => {
        calls.push('rounds');
        return [{ round_id: 4, round_name: null }];
      },
      managers: async () => {
        calls.push('managers');
        return [{ ...manager, ignored: true }];
      },
      lastCompleted: async () => {
        calls.push('last');
        return null;
      },
      resolveRound: async () => {
        calls.push('policy');
        return 0;
      },
    });
    expect(await service.fetchRoundsList()).toEqual({
      rounds: [{ round_id: 4, round_name: null }],
      users: [manager],
      defaultRoundId: 4,
    });
    expect(calls).toEqual(['rounds', 'managers', 'last', 'policy']);
  });
  it('does not swallow discarded calendar errors', async () => {
    const failure = new Error('fixture');
    const resolveRound = vi.fn(async () => null);
    const service = createRoundsListService({
      rounds: async () => [],
      managers: async () => [],
      lastCompleted: async () => {
        throw failure;
      },
      resolveRound,
    });
    await expect(service.fetchRoundsList()).rejects.toBe(failure);
    expect(resolveRound).not.toHaveBeenCalled();
  });
  it('preserves top-two ordering, strict manager IDs, percentages and excludes empty managers', async () => {
    const service = createFormationUsageService({
      managers: async () => [manager, { ...manager, id: '8' }],
      usage: async () => ({
        global: [{ alineacion: '1-2-2', count: 3 }],
        byUser: [
          { user_id: '7', alineacion: '2-1-2', count: 2, total_count: 4, formation_rank: '1' },
          { user_id: '7', alineacion: '1-2-2', count: 1, total_count: 4, formation_rank: '2' },
        ],
      }),
    });
    const result = await service.fetchLineupStats();
    expect(result.global[0].percentage).toBe(100);
    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toMatchObject({
      userId: '7',
      totalRounds: 4,
      favorite: { formation: '2-1-2', percentage: 50 },
    });
    expect(result.users[0].topFormations.map((f) => f.percentage)).toEqual([50, 25]);
  });
});
