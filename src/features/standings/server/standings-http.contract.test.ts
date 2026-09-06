import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const query = vi.hoisted(() => ({
  queryFullStandings: vi.fn(),
  querySimpleStandings: vi.fn(),
  queryValueRanking: vi.fn(),
  queryLeagueOverview: vi.fn(),
}));
vi.mock('./queries/base-standings.query', () => query);
import { GET as full, dynamic as fullDynamic } from '@/app/api/standings/full/route';
import {
  GET as overview,
  dynamic as overviewDynamic,
} from '@/app/api/standings/league-totals/route';
import { GET as values, dynamic as valuesDynamic } from '@/app/api/standings/value-ranking/route';
beforeEach(() => vi.resetAllMocks());

it.each([undefined, 'authjs.session-token=synthetic-session'])(
  'full handler uses URL only, unchanged envelope, allowlist and public cache (cookie %s)',
  async (cookie) => {
    const row = {
      user_id: '1',
      name: null,
      icon: null,
      color_index: 0,
      total_points: 8,
      rounds_played: 2,
      avg_points: 4,
      best_round: 6,
      worst_round: 2,
      round_wins: 1,
      team_value: 99,
      price_trend: -2,
      position: 1,
    };
    query.queryFullStandings.mockResolvedValue([{ ...row, forbiddenField: 'excluded' }]);
    const response = await full(
      new NextRequest('http://localhost/api/standings/full?sort=unknown&dir=asc&userId=other', {
        headers: cookie ? { cookie } : {},
      })
    );
    expect(query.queryFullStandings).toHaveBeenCalledWith({ sortBy: 'unknown', direction: 'asc' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, stale-while-revalidate=60'
    );
    expect(await response.json()).toEqual({ success: true, data: [row] });
  }
);
it('returns empty rankings unchanged and keeps every adapter force dynamic', async () => {
  query.queryFullStandings.mockResolvedValue([]);
  expect(await (await full(new NextRequest('http://localhost/api/standings/full'))).json()).toEqual(
    { success: true, data: [] }
  );
  expect([fullDynamic, overviewDynamic, valuesDynamic]).toEqual(Array(3).fill('force-dynamic'));
});
it('preserves overview nulls/omitted nested records and 900-second cache', async () => {
  query.queryLeagueOverview.mockResolvedValue({
    pointsStats: { total_points: null, total_rounds: 0, total_users: 0 },
    valueStats: { total_league_value: null, max_team_value: null, min_team_value: null },
    seasonRounds: { total_season_rounds: 0 },
    mostValuable: undefined,
    roundRecord: undefined,
    leaderStreak: { streak: 0 },
  });
  const response = await overview();
  expect(response.headers.get('Cache-Control')).toBe(
    'public, max-age=900, stale-while-revalidate=60'
  );
  expect(await response.json()).toEqual({
    success: true,
    data: {
      total_points: null,
      total_rounds: 0,
      total_users: 0,
      total_league_value: null,
      max_team_value: null,
      min_team_value: null,
      avg_round_points: 0,
      total_season_rounds: 34,
      winner_streak: 0,
    },
  });
});
it('preserves ranking bigint strings and 900-second cache', async () => {
  const row = {
    user_id: '1',
    name: 'Synthetic',
    icon: null,
    color_index: 1,
    team_value: '9007199254740993',
    price_trend: 0,
    squad_size: 0,
    value_position: 1,
  };
  query.queryValueRanking.mockResolvedValue([{ ...row, forbiddenField: 'excluded' }]);
  const response = await values();
  expect(response.headers.get('Cache-Control')).toBe(
    'public, max-age=900, stale-while-revalidate=60'
  );
  expect(await response.json()).toEqual({ success: true, data: [row] });
});
it.each(['full', 'overview', 'values'] as const)(
  'keeps private generic errors for %s',
  async (name) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    query.queryFullStandings.mockRejectedValue(new Error('synthetic failure'));
    query.queryLeagueOverview.mockRejectedValue(new Error('synthetic failure'));
    query.queryValueRanking.mockRejectedValue(new Error('synthetic failure'));
    const response = await {
      full: () => full(new NextRequest('http://localhost/api/standings/full')),
      overview,
      values,
    }[name]();
    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    expect(await response.json()).toEqual({ success: false, error: 'Internal Server Error' });
    error.mockRestore();
  }
);
