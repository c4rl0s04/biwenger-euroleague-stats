import { describe, expect, it } from 'vitest';
import {
  mapFullStandings,
  mapSimpleStandings,
  mapValueRanking,
  mapLeagueOverview,
} from './base-standings.mapper';
import type { LeagueOverviewRecords } from '../queries/base-standings.records';

const identity = { user_id: 'm1', name: null, icon: null, color_index: 0 };
const extra = { privateField: 'must-not-leak' };
export const emptyOverview: LeagueOverviewRecords = {
  pointsStats: { total_points: null, total_rounds: 0, total_users: 0 },
  valueStats: { total_league_value: null, max_team_value: null, min_team_value: null },
  seasonRounds: { total_season_rounds: 0 },
  mostValuable: undefined,
  roundRecord: undefined,
  leaderStreak: { streak: 0 },
};

describe('explicit standings projections', () => {
  it('allowlists full rankings and preserves zeroes, null names and negative trends', () => {
    const expected = {
      ...identity,
      total_points: 0,
      rounds_played: 0,
      avg_points: 0,
      best_round: 0,
      worst_round: 0,
      round_wins: 0,
      team_value: 20,
      price_trend: -5,
      position: 1,
    };
    expect(mapFullStandings({ ...expected, ...extra })).toEqual(expected);
  });
  it('preserves bigint strings rather than losing precision or changing HTTP types', () => {
    const simple = {
      ...identity,
      total_points: 10,
      team_value: '9007199254740993',
      price_trend: -1,
      position: 1,
    };
    const value = {
      ...identity,
      team_value: '9007199254740993',
      price_trend: 0,
      squad_size: 0,
      value_position: 1,
    };
    expect(mapSimpleStandings({ ...simple, ...extra })).toEqual(simple);
    expect(mapValueRanking({ ...value, ...extra })).toEqual(value);
  });
  it('keeps nullable SQL sums, omitted nested records and legacy season fallback', () => {
    expect(JSON.parse(JSON.stringify(mapLeagueOverview(emptyOverview)))).toEqual({
      total_points: null,
      total_rounds: 0,
      total_users: 0,
      total_league_value: null,
      max_team_value: null,
      min_team_value: null,
      avg_round_points: 0,
      total_season_rounds: 34,
      winner_streak: 0,
    });
  });
  it('allowlists nested records and preserves decimal rounding', () => {
    const mostValuable = { name: 'Manager', icon: null, color_index: 2, team_value: '300' };
    const roundRecord = { ...identity, round_name: null, points: null };
    const result = mapLeagueOverview({
      ...emptyOverview,
      pointsStats: { total_points: 100, total_rounds: 3, total_users: 2 },
      seasonRounds: { total_season_rounds: 38 },
      mostValuable: { ...mostValuable, ...extra },
      roundRecord: { ...roundRecord, ...extra },
      leaderStreak: { streak: 2 },
    });
    expect(result).toMatchObject({
      avg_round_points: 16.7,
      total_season_rounds: 38,
      most_valuable_user: mostValuable,
      round_record: roundRecord,
      winner_streak: 2,
    });
    expect(JSON.stringify(result)).not.toContain('privateField');
  });
  it('preserves null-sum coercion and zero-user divisor fallback', () => {
    expect(
      mapLeagueOverview({
        ...emptyOverview,
        pointsStats: { total_points: null, total_rounds: 2, total_users: 0 },
      }).avg_round_points
    ).toBe(0);
    expect(
      mapLeagueOverview({
        ...emptyOverview,
        pointsStats: { total_points: 7, total_rounds: 2, total_users: 0 },
      }).avg_round_points
    ).toBe(3.5);
  });
});
