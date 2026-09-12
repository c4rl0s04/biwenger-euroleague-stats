import { describe, expect, it, vi } from 'vitest';
import * as performance from './performance.mapper';
import * as theoretical from './theoretical.mapper';
import * as progression from './progression.mapper';
import * as curiosities from './curiosities.mapper';

vi.mock('server-only', () => ({}));
const identity = { user_id: '007-manager', name: null, icon: '', color_index: null };

describe('analytics projection compatibility', () => {
  const cases = [
    [performance.mapVolatilityStat, { ...identity, avg_points: -1.5, std_dev: 0 }],
    [performance.mapHunterStat, { ...identity, recent_points: 0, gained: -2 }],
    [performance.mapFloorCeilingStat, { ...identity, floor: -5, ceiling: 8, avg: 1.5 }],
    [performance.mapDominanceStat, { ...identity, wins: 0, avg_margin: -1.5 }],
    [performance.mapReliabilityStat, { ...identity, total_rounds: 0, rounds_above: 0, pct: 0 }],
    [
      theoretical.mapTheoreticalGapStat,
      { ...identity, current_points: 0, perfectTotal: 0, gap: 0, pct: NaN },
    ],
    [
      theoretical.mapLeagueComparisonStat,
      { ...identity, above_avg_count: 0, below_avg_count: 3, avg_diff: -1.5 },
    ],
    [progression.mapStreakStat, { ...identity, longest_streak: 3, current_streak: 0 }],
    [
      progression.mapPlacementStat,
      { ...identity, top_3_count: 2, bottom_3_count: 1, total_rounds: 5 },
    ],
    [curiosities.mapBottlerStat, { ...identity, wins: 1, seconds: 2, thirds: 0, bottler_score: 4 }],
    [curiosities.mapHeartbreakerStat, { ...identity, count: 0, total_diff: 0 }],
    [curiosities.mapNoGloryStat, { ...identity, total_points_no_glory: -7, rounds_count: 1 }],
    [curiosities.mapJinxStat, { ...identity, jinxed_count: 0 }],
    [
      curiosities.mapEfficiencyStat,
      { ...identity, total_points: -7, team_value: 100, points_per_million: -0.5 },
    ],
  ] as const;

  // Keep each mapper and its expected projection paired without broad casts.
  function assertProjection<T extends object>(mapper: (row: T) => T, row: T) {
    const input = { ...row, unrelated: 'synthetic' };
    expect(mapper(input)).toEqual(row);
    expect(mapper(input)).not.toBe(input);
  }

  it('retains scalar projections, text identity, nulls, zeros and non-finite arithmetic', () => {
    assertProjection(performance.mapVolatilityStat, cases[0][1]);
    assertProjection(performance.mapHunterStat, cases[1][1]);
    assertProjection(performance.mapFloorCeilingStat, cases[2][1]);
    assertProjection(performance.mapDominanceStat, cases[3][1]);
    assertProjection(performance.mapReliabilityStat, cases[4][1]);
    assertProjection(theoretical.mapTheoreticalGapStat, cases[5][1]);
    assertProjection(theoretical.mapLeagueComparisonStat, cases[6][1]);
    assertProjection(progression.mapStreakStat, cases[7][1]);
    assertProjection(progression.mapPlacementStat, cases[8][1]);
    assertProjection(curiosities.mapBottlerStat, cases[9][1]);
    assertProjection(curiosities.mapHeartbreakerStat, cases[10][1]);
    assertProjection(curiosities.mapNoGloryStat, cases[11][1]);
    assertProjection(curiosities.mapJinxStat, cases[12][1]);
    assertProjection(curiosities.mapEfficiencyStat, cases[13][1]);
    assertProjection(performance.mapHeatCheckStat, {
      ...identity,
      last5_avg: 0,
      season_avg: 1.5,
      diff: -1.5,
      status: 'ice',
    });
    assertProjection(curiosities.mapDetailedCaptainStat, {
      user_id: '007',
      user_name: null,
      user_icon: null,
      color_index: 0,
      total_rounds: 0,
      total_captain_points: 0,
      avg_captain_points: 0,
      success_rate: 0,
      unique_captains: 0,
      best_points: 0,
      worst_points: 0,
      most_used_captain: null,
      most_used_captain_id: null,
    });
    assertProjection(progression.mapRoundWinner, {
      ...identity,
      round_id: 2,
      round_name: null,
      points: 0,
    });
    assertProjection(progression.mapPointsProgression, {
      user_id: '007',
      name: null,
      color_index: 0,
      round_id: 2,
      round_name: null,
      points: 0,
      cumulative_points: -5,
    });
    assertProjection(theoretical.mapTheoreticalStandingsStat, {
      ...identity,
      total_actual: 0,
      total_ideal: 5,
      gap: 5,
      efficiency: 0,
      rounds_played: 1,
    });
  });

  it('retains rolling short labels without leaking nested fields', () => {
    const point = { round: 2, round_name: 'Jornada 2', short_name: 'J2', avg: -1.5 };
    const input = { ...identity, data: [{ ...point, extra: 'omit' }] };
    expect(performance.mapRollingAverageStat(input)).toEqual({ ...identity, data: [point] });
  });

  it('preserves undefined position, NaN changes and round labels', () => {
    const round = { id: 2, name: 'Jornada 2', shortName: 'J2' };
    const stats = {
      biggestClimber: { name: '', change: 0, round: '' },
      biggestFaller: { name: '', change: 0, round: '' },
    };
    const user = {
      id: '007',
      name: null,
      icon: null,
      color_index: 0,
      history: [{ position: undefined, change: NaN }],
    };
    const input = { rounds: [{ ...round, extra: 1 }], users: [user], valid: true, stats };
    expect(performance.mapPositionChangeStat(input)).toEqual({
      rounds: [round],
      users: [user],
      valid: true,
      stats,
    });
  });

  it('allowlists distribution bins, matrix results and heatmap rows', () => {
    const distribution = { '90-135': 1, '136-170': 0, '171-205': 2, '206+': 0 };
    expect(
      performance.mapPointDistributionStat({
        ...identity,
        distribution: { ...distribution, extra: 9 },
      })
    ).toEqual({ ...identity, distribution });
    const user = { id: '007', name: null, icon: '', color_index: 0 };
    expect(
      theoretical.mapRivalryMatrixStat({
        users: [user],
        matrix: { '007': { x: { wins: 1, losses: 0, ties: 2 } } },
      })
    ).toEqual({ users: [user], matrix: { '007': { x: { wins: 1, losses: 0, ties: 2 } } } });
    expect(
      theoretical.mapHeatmapStat({
        rounds: [{ id: 1, name: null, shortName: '' }],
        users: [{ ...user, scores: [0, null, -5] }],
      })
    ).toEqual({
      rounds: [{ id: 1, name: null, shortName: '' }],
      users: [{ ...user, scores: [0, null, -5] }],
    });
  });
});
