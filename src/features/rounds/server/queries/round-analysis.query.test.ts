import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { LineupRow } from '../../models/round-query-contracts';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  season: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  groupBy: vi.fn(),
  orderBy: vi.fn(),
}));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: mocks.query }, db: mocks }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import {
  getAllRounds,
  getUserLineup,
  hasOfficialStats,
  getOfficialStandings,
  getLivingStandings,
  getRoundGlobalStats,
  getIdealLineup,
  getPlayersLeftOut,
  getUserOptimization,
  getUserRoundsHistoryDAO,
  getLineupUsageStats,
  getCoachRating,
} from './round-analysis.query';

const row = (id: number, changes: Partial<LineupRow> = {}): LineupRow => ({
  player_id: id,
  name: `Player ${id}`,
  position: 'Base',
  img: null,
  team: 'Team',
  team_short: null,
  team_img: null,
  is_captain: false,
  role: 'titular',
  raw_points: 10,
  valuation: 4,
  stats_points: 2,
  stats_rebounds: 1,
  stats_assists: 1,
  minutes: null,
  current_status: null,
  player_exists: id,
  ...changes,
});
const rows = (...results: unknown[][]) =>
  results.forEach((result) => mocks.query.mockResolvedValueOnce({ rows: result }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.season.mockResolvedValue('fixture-season');
  mocks.query.mockResolvedValue({ rows: [] });
  for (const name of ['select', 'from', 'where', 'groupBy'] as const)
    mocks[name].mockReturnValue(mocks);
  mocks.orderBy.mockResolvedValue([]);
});

describe('Rounds read query compatibility', () => {
  it('keeps the two-field season-scoped selector and descending ID ordering without cache', async () => {
    await getAllRounds();
    await getAllRounds();
    expect(mocks.season).toHaveBeenCalledTimes(2);
    expect(mocks.season).toHaveBeenCalledWith();
    expect(Object.keys(mocks.select.mock.calls[0][0])).toEqual(['round_id', 'round_name']);
    const dialect = new PgDialect();
    expect(dialect.sqlToQuery(mocks.where.mock.calls[0][0])).toMatchObject({
      params: ['fixture-season'],
    });
    expect(dialect.sqlToQuery(mocks.orderBy.mock.calls[0][0]).sql).toBe(
      '"matches"."round_id" desc'
    );
  });

  it('reconstructs exactly one ghost using stored total and captain priority', async () => {
    rows(
      [row(1), row(2, { player_exists: null, raw_points: null, is_captain: true, role: 'bench' })],
      [{ points: 30, position: '2', participated: true }]
    );
    const result = await getUserLineup('007', '8abc');
    expect(result.players[1]).toMatchObject({ points: 10, is_missing: true, calculated: true });
    expect(result.summary).toEqual({ total_points: 30, round_rank: 2, participated: true });
    for (const call of mocks.query.mock.calls)
      expect(call[1]).toEqual(['007', '8abc', 'fixture-season']);
    expect(mocks.query.mock.calls[0][0]).toContain("WHEN p.position = 'Base' THEN 1");
    expect(mocks.query.mock.calls[1][0]).toContain('ur2.points > ur.points');
  });

  it('does not reconstruct zero-total, known-player null stats or absent-summary cases', async () => {
    rows(
      [row(1, { player_exists: null, raw_points: null })],
      [{ points: 0, position: '1', participated: false }],
      [row(2, { raw_points: null })],
      []
    );
    expect((await getUserLineup('u', 1)).players[0]).toMatchObject({
      points: 0,
      calculated: false,
    });
    const live = await getUserLineup('u', 1);
    expect(live.summary).toBeNull();
    expect(live.players[0]).toMatchObject({ points: 0, is_missing: false, calculated: false });
  });

  it('retains the multiple-ghost warning and avoids inventing individual scores', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    rows(
      [
        row(1, { player_exists: null, raw_points: null }),
        row(2, { player_exists: null, raw_points: null }),
      ],
      [{ points: 20 }]
    );
    expect((await getUserLineup('fixture-user', 4)).players.map((p) => p.calculated)).toEqual([
      false,
      false,
    ]);
    expect(warning).toHaveBeenCalledTimes(1);
    warning.mockRestore();
  });

  it('preserves official/live aggregate conversion, participation and the live past_total field', async () => {
    const identity = { id: '007', name: null, icon: null, color_index: 0 };
    rows(
      [{ ...identity, round_points: '4.9', total_points: '21', participated: null }],
      [{ ...identity, round_points: '4.5', past_total: '20', participated: 1 }]
    );
    expect(await getOfficialStandings(9)).toEqual([
      { ...identity, points: 4, round_points: 4, total_points: 21, participated: false },
    ]);
    expect(await getLivingStandings(9)).toEqual([
      {
        ...identity,
        points: 5,
        round_points: 5,
        total_points: 25,
        past_total: '20',
        participated: true,
      },
    ]);
    expect(mocks.query.mock.calls[0][0]).toContain('ur2.round_id <= $1');
    expect(mocks.query.mock.calls[1][0]).toContain('ur2.round_id < $1');
    expect(mocks.query.mock.calls[1][0]).toContain('WHEN l.is_captain::int = 1 THEN 2.0');
  });

  it('keeps official-stat existence and global empty defaults with all six season-scoped queries', async () => {
    rows([{ exists: true }]);
    expect(await hasOfficialStats('9')).toBe(true);
    expect(await hasOfficialStats('9')).toBe(false);
    mocks.query.mockClear();
    expect(await getRoundGlobalStats('9')).toEqual({
      mvp: null,
      topScorer: null,
      topRebounder: null,
      topAssister: null,
      avgScore: 0,
      winner: null,
    });
    expect(mocks.query).toHaveBeenCalledTimes(6);
    for (const call of mocks.query.mock.calls) expect(call[1]).toEqual(['9', 'fixture-season']);
    expect(mocks.query.mock.calls[0][0]).toContain('DESC NULLS LAST');
  });

  it('preserves nullable global fields and decimal average conversion', async () => {
    const identity = { id: 1, name: null, img: null, position: null, team_name: null };
    rows(
      [{ ...identity, points: null, valuation: null }],
      [{ ...identity, stat_value: 2 }],
      [],
      [],
      [{ avg_score: '4.5' }],
      [{ name: null, points: 8, icon: null }]
    );
    expect(await getRoundGlobalStats(1)).toEqual({
      mvp: { ...identity, points: null, valuation: null },
      topScorer: { ...identity, stat_value: 2 },
      topRebounder: null,
      topAssister: null,
      avgScore: 4.5,
      winner: { name: null, points: 8, icon: null },
    });
  });

  it('retains global ideal object envelope, top-50 query and rounded total', async () => {
    rows([
      {
        player_id: 1,
        name: null,
        position: 'Base',
        img: null,
        team_id: null,
        team_short: null,
        team_img: null,
        points: 3,
        valuation: null,
      },
    ]);
    const result = await getIdealLineup(1);
    expect(result.totalPoints).toBe(6);
    expect(result.idealLineup[0]).toMatchObject({
      player_id: 1,
      role: 'titular',
      is_captain: true,
      stats_points: 3,
      multiplier: 2,
    });
    expect(mocks.query.mock.calls[0][0]).toContain('LIMIT 50');
  });

  it('replays ownership backward at the inherited one-hour buffer and excludes the actual lineup', async () => {
    rows(
      [{ name: 'Fixture Manager' }],
      [{ start_date: new Date('2025-01-01T12:00:00Z') }],
      [{ player_id: 1 }, { player_id: 2 }],
      [
        { player_id: 2, comprador: 'Fixture Manager', vendedor: 'Other' },
        { player_id: 3, comprador: 'Other', vendedor: 'Fixture Manager' },
      ],
      [{ player_id: 1 }],
      [
        {
          player_id: 3,
          name: 'Player 3',
          position: 'Pivot',
          img: null,
          team_short: null,
          team_img: null,
          points: 20,
        },
      ]
    );
    const result = await getPlayersLeftOut('007', 3);
    expect(result[0].player_id).toBe(3);
    expect(mocks.query.mock.calls[3][1]).toEqual(['Fixture Manager', 1735736400, 'fixture-season']);
    expect(mocks.query.mock.calls[3][0]).toContain('ORDER BY timestamp DESC');
    expect(mocks.query.mock.calls[5][1]).toEqual([3, [3], 'fixture-season']);
    expect(mocks.season).toHaveBeenCalledTimes(2);
  });

  it('keeps empty historic-squad early return before ghost injection and catches lookup failures', async () => {
    expect(await getUserOptimization('u', 1)).toBeNull();
    expect(mocks.query).toHaveBeenCalledTimes(1);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.query.mockRejectedValueOnce(new Error('synthetic lookup failure'));
    expect(await getPlayersLeftOut('u', 1)).toEqual([]);
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it('injects a missing lineup player into the optimization pool before scoring', async () => {
    rows(
      [{ name: 'Fixture Manager' }],
      [{ start_date: '2025-01-01T12:00:00Z' }],
      [{ player_id: 1 }],
      [],
      [
        {
          player_id: 1,
          name: 'Known',
          position: 'Base',
          img: null,
          team_short: null,
          team_img: null,
          points: 10,
          valuation: 0,
        },
      ],
      [
        row(1),
        row(99, { position: 'Bench', player_exists: null, raw_points: null, is_captain: true }),
      ],
      [{ points: 50, position: '1', participated: true }]
    );
    const result = await getUserOptimization('u', 1);
    expect(result?.optimalLineup.map((p) => p.player_id)).toEqual([99, 1]);
    expect(result?.optimalLineup[0]).toMatchObject({
      position: 'Alero',
      points: 20,
      is_captain: true,
    });
    expect(result?.totalPoints).toBe(50);
    expect(mocks.season).toHaveBeenCalledTimes(3);
  });

  it('preserves history nullable fields, ascending order and top-two formation SQL', async () => {
    const history = { round_id: 1, round_name: null, actual_points: null, participated: null };
    rows(
      [history],
      [{ alineacion: '1-2-2', count: 2 }],
      [{ user_id: '007', alineacion: '1-2-2', count: 2, total_count: 3, formation_rank: '1' }]
    );
    expect(await getUserRoundsHistoryDAO('007')).toEqual([history]);
    expect(mocks.query.mock.calls[0][0]).toContain('ORDER BY ur.round_id ASC');
    const formations = await getLineupUsageStats();
    expect(formations.byUser[0].formation_rank).toBe('1');
    expect(mocks.query.mock.calls[2][0]).toContain('WHERE formation_rank <= 2');
    expect(mocks.query.mock.calls[2][0]).toContain('HAVING COUNT(*) = 5');
  });

  it('propagates season errors unchanged instead of returning a cached or empty result', async () => {
    const failure = new Error('synthetic season failure');
    mocks.season.mockRejectedValue(failure);
    await expect(getAllRounds()).rejects.toBe(failure);
    await expect(getUserLineup('u', 1)).rejects.toBe(failure);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('keeps coach-rating null when optimization is absent but still reads the actual lineup', async () => {
    expect(await getCoachRating('u', 1)).toBeNull();
    expect(mocks.query).toHaveBeenCalledTimes(3);
    expect(mocks.season).toHaveBeenCalledTimes(3);
  });

  it('uses live weighted points without an official total and preserves uncapped efficiency', async () => {
    rows(
      [{ name: 'Fixture Manager' }],
      [{ start_date: '2025-01-01T12:00:00Z' }],
      [{ player_id: 1 }],
      [],
      [
        {
          player_id: 1,
          name: 'Known',
          position: 'Base',
          img: null,
          team_short: null,
          team_img: null,
          points: 3,
          valuation: 0,
        },
      ],
      [row(1, { raw_points: 4, is_captain: true })],
      [],
      [row(1, { raw_points: 4, is_captain: true })],
      []
    );
    expect(await getCoachRating('u', 1)).toMatchObject({
      actualScore: 8,
      maxScore: 6,
      efficiency: 133,
    });
    expect(mocks.query).toHaveBeenCalledTimes(9);
    expect(mocks.season).toHaveBeenCalledTimes(4);
  });
});
