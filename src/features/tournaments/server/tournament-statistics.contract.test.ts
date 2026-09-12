import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tournament, TournamentFixture, TournamentStanding } from '../public';

vi.mock('server-only', () => ({}));
const reads = vi.hoisted(() => ({ all: vi.fn(), fixtures: vi.fn(), standings: vi.fn() }));
vi.mock('./services/tournament-read.service', () => ({
  getAllTournaments: reads.all,
  getTournamentFixtures: reads.fixtures,
  getTournamentStandings: reads.standings,
}));
import { getGlobalTournamentStats } from '@/lib/services/statsService';

function tournament(id: number, overrides: Partial<Tournament> = {}): Tournament {
  return {
    id,
    name: `Cup ${id}`,
    type: 'league',
    status: 'finished',
    data_json: null,
    data: {},
    ...overrides,
  };
}
function fixture(id: number, overrides: Partial<TournamentFixture> = {}): TournamentFixture {
  return {
    id,
    tournament_id: 1,
    phase_id: 1,
    round_name: 'Final',
    round_id: 1,
    group_name: null,
    home_user_id: '01',
    away_user_id: '02',
    home_score: 10,
    away_score: 5,
    date: id,
    status: 'finished',
    phase_name: 'Final',
    phase_type: 'playoff',
    home_user_name: 'Home',
    home_user_icon: null,
    home_user_color: 2,
    away_user_name: 'Away',
    away_user_icon: null,
    away_user_color: 3,
    ...overrides,
  };
}
function standing(overrides: Partial<TournamentStanding> = {}): TournamentStanding {
  return {
    id: 1,
    season_id: 'synthetic',
    tournament_id: 1,
    phase_name: null,
    group_name: null,
    user_id: '01',
    position: 1,
    points: 6,
    won: 2,
    lost: 1,
    drawn: 0,
    scored: 30,
    against: 20,
    user_name: 'Home',
    user_icon: null,
    user_color: 7,
    ...overrides,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  reads.all.mockResolvedValue({ active: [], finished: [], all: [] });
  reads.fixtures.mockResolvedValue([]);
  reads.standings.mockResolvedValue([]);
});

describe('global Tournament statistics pre-migration contract', () => {
  it('returns empty records and reads all three sources on every invocation', async () => {
    const empty = {
      hallOfFame: [],
      globalStats: [],
      leagueStats: [],
      records: {
        biggestWin: null,
        highestScoring: null,
        longestStreak: null,
      },
    };
    expect(await getGlobalTournamentStats()).toEqual(empty);
    expect(await getGlobalTournamentStats()).toEqual(empty);
    expect(reads.all).toHaveBeenCalledTimes(2);
    expect(reads.fixtures.mock.calls).toEqual([[null], [null]]);
    expect(reads.standings.mock.calls).toEqual([[null], [null]]);
  });

  it('counts snapshot winners even on active tournaments and lets latest standings color win', async () => {
    reads.all.mockResolvedValue({
      all: [
        tournament(1, {
          status: 'active',
          data: { winner: { id: '01', name: 'First name', icon: 'first', colorIndex: 8 } },
        }),
        tournament(2, { data: { winner: { id: '01', name: 'Later name', icon: 'later' } } }),
        tournament(3, { data: { winner: { id: '02', name: 'Second', color_index: 4 } } }),
        tournament(4, { data: { winner: { id: 0, name: 'Ignored' } } }),
      ],
    });
    reads.standings.mockResolvedValue([standing({ user_color: 5 }), standing({ user_color: 0 })]);
    expect((await getGlobalTournamentStats()).hallOfFame).toEqual([
      {
        id: '01',
        name: 'First name',
        icon: 'first',
        colorIndex: 0,
        titles: 2,
        tournaments: ['Cup 1', 'Cup 2'],
      },
      {
        id: '02',
        name: 'Second',
        icon: undefined,
        colorIndex: 4,
        titles: 1,
        tournaments: ['Cup 3'],
      },
    ]);
  });

  it('sorts games chronologically, preserves string IDs and calculates both sides and records', async () => {
    const games = [fixture(3, { home_score: 4, away_score: 4 }), fixture(1), fixture(2)];
    reads.fixtures.mockResolvedValue(games);
    const result = await getGlobalTournamentStats();
    expect(result.globalStats).toEqual([
      {
        id: '01',
        name: 'Home',
        icon: null,
        colorIndex: 2,
        played: 3,
        won: 2,
        drawn: 1,
        lost: 0,
        gf: 24,
        ga: 14,
        points: 7,
        form: ['W', 'W', 'D'],
        currentStreak: 0,
        longestStreak: 2,
        signedStreak: 0,
      },
      {
        id: '02',
        name: 'Away',
        icon: null,
        colorIndex: 3,
        played: 3,
        won: 0,
        drawn: 1,
        lost: 2,
        gf: 14,
        ga: 24,
        points: 1,
        form: ['L', 'L', 'D'],
        currentStreak: 0,
        longestStreak: 0,
        signedStreak: 0,
      },
    ]);
    expect(result.records.biggestWin).toMatchObject({
      diff: 5,
      match: { id: 1 },
      score: '10 - 5',
      winner: { id: '01' },
      loser: { id: '02' },
    });
    expect(result.records.highestScoring).toMatchObject({
      total: 15,
      score: '10 - 5',
      match: { id: 1, home_user: { id: '01' }, away_user: { id: '02' } },
    });
    expect(result.records.longestStreak).toEqual({
      count: 2,
      user: { id: '01', name: 'Home', icon: null, colorIndex: 2 },
    });
    expect(games.map((game) => game.id)).toEqual([3, 1, 2]);
  });

  it('excludes byes/unscored active games but counts finished null scores and partially scored games', async () => {
    reads.fixtures.mockResolvedValue([
      fixture(1, { away_user_id: null }),
      fixture(2, { status: 'active', home_score: null, away_score: null }),
      fixture(3, { home_score: null, away_score: null }),
      fixture(4, { status: 'active', home_score: null, away_score: 8 }),
    ]);
    const result = await getGlobalTournamentStats();
    expect(
      result.globalStats.map(({ id, played, points, form }) => ({ id, played, points, form }))
    ).toEqual([
      { id: '02', played: 2, points: 4, form: ['D', 'W'] },
      { id: '01', played: 2, points: 1, form: ['D', 'L'] },
    ]);
    expect(result.records.biggestWin).toMatchObject({ score: '8 - 0', winner: { id: '02' } });
    expect(result.records.highestScoring?.score).toBe('null - 8');
  });

  it('keeps only the last five form entries but preserves full streak length', async () => {
    reads.fixtures.mockResolvedValue(Array.from({ length: 7 }, (_, index) => fixture(index + 1)));
    const result = await getGlobalTournamentStats();
    expect(result.globalStats[0]).toMatchObject({
      played: 7,
      form: ['W', 'W', 'W', 'W', 'W'],
      longestStreak: 7,
      signedStreak: 7,
    });
    expect(result.globalStats[1]).toMatchObject({ signedStreak: -7 });
  });

  it('aggregates only league standings, including null counters with their existing arithmetic', async () => {
    reads.all.mockResolvedValue({ all: [tournament(1), tournament(2, { type: 'playoff' })] });
    reads.standings.mockResolvedValue([
      standing(),
      standing({
        id: 2,
        points: null,
        won: null,
        drawn: null,
        lost: null,
        scored: null,
        against: null,
      }),
      standing({ id: 3, tournament_id: 2, points: 999 }),
    ]);
    expect((await getGlobalTournamentStats()).leagueStats).toEqual([
      {
        id: '01',
        name: 'Home',
        icon: null,
        colorIndex: 7,
        played: 3,
        won: 2,
        drawn: 0,
        lost: 1,
        points: 6,
        scored: 30,
        against: 20,
        gf: 0,
        ga: 0,
        form: [],
        currentStreak: 0,
        longestStreak: 0,
        signedStreak: 0,
      },
    ]);
  });

  it.each(['all', 'fixtures', 'standings'] as const)(
    'propagates %s failures without substituting empty statistics',
    async (source) => {
      const error = new Error('synthetic read failure');
      reads[source].mockRejectedValueOnce(error);
      await expect(getGlobalTournamentStats()).rejects.toBe(error);
      expect(reads.all).toHaveBeenCalledOnce();
      expect(reads.fixtures).toHaveBeenCalledOnce();
      expect(reads.standings).toHaveBeenCalledOnce();
    }
  );
});
