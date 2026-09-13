import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/features/managers/server', () => ({
  getManagerDirectory: vi.fn(() => {
    throw new Error('This isolated Market read must not request the manager directory');
  }),
}));
const dependencies = vi.hoisted(() => ({
  query: vi.fn(),
  season: vi.fn(),
  probabilities: vi.fn(),
  counts: vi.fn(),
  form: vi.fn(),
}));
vi.mock('../../index', () => ({ pgClient: { query: dependencies.query }, db: {} }));
vi.mock('@/lib/db/client', () => ({ db: { query: dependencies.query } }));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: dependencies.season }));
vi.mock('@/features/teams/server', () => ({
  getAllTeamsPlayoffProbabilities: dependencies.probabilities,
  getAllTeamMatchesCount: dependencies.counts,
}));
vi.mock('@/features/players/server', () => ({
  getPlayerFormStats: async (...args: number[]) => {
    const map = await dependencies.form(...args);
    return Array.from(
      map.entries(),
      ([playerId, row]: [
        number,
        { recent_scores: string; avg_recent_points: number; avg_form_score: number },
      ]) => ({
        playerId,
        recentScores: row.recent_scores,
        averageRecentPoints: row.avg_recent_points,
        formScore: row.avg_form_score,
      })
    );
  },
}));

import { getCurrentMarketListings, getMarketTrendsAnalysis } from './market';

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
  dependencies.probabilities.mockResolvedValue({ 7: 90 });
  dependencies.counts.mockResolvedValue({ 7: 10 });
  dependencies.form.mockResolvedValue(new Map());
  dependencies.query.mockResolvedValue({ rows: [] });
});

const strongPlayer = {
  player_id: 9,
  name: 'Fixture Player',
  team_id: 7,
  price: '1000000',
  price_trend: '50001',
  total_points: '100',
  min_points: '10',
  max_points: '30',
  games_played: '10',
  season_avg: '16',
  real_price: '900000',
  seller_id: null,
};

it('preserves internal 14-day trend reads, numeric truncation and nullable transfer facts', async () => {
  dependencies.query.mockResolvedValue({
    rows: [
      {
        date: '2026-01-02',
        volume: '10.99',
        avg_price: '3.75',
        ops_count: '2',
        transfers: [
          { player_name: null, price: null },
          { player_name: 'Fixture Player', price: 10 },
        ],
      },
    ],
  });
  expect(await getMarketTrendsAnalysis(14)).toEqual([
    {
      date: '2026-01-02',
      volume: 10,
      avg_price: 3,
      ops_count: 2,
      transfers: [
        { player_name: null, price: null },
        { player_name: 'Fixture Player', price: 10 },
      ],
    },
  ]);
  expect(dependencies.query).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining("interval '14 days'"),
    ['fixture-season']
  );
});

it('preserves strong-player recommendation, raw compatibility fields and form enrichment', async () => {
  dependencies.form.mockResolvedValue(
    new Map([
      [
        9,
        {
          recent_scores: '18,X,18',
          avg_recent_points: 18,
          avg_form_score: 12,
        },
      ],
    ])
  );
  dependencies.query.mockResolvedValue({ rows: [strongPlayer] });
  expect(await getCurrentMarketListings()).toEqual([
    {
      ...strongPlayer,
      price: 1000000,
      price_trend: 50001,
      total_points: 100,
      season_avg: 16,
      recent_scores: '18,X,18',
      avg_recent_points: 18,
      value_score: 100,
      recommendation_score: 99,
      recommendation_label: 'Fichaje Obligatorio',
      recommendation_color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
      recommendation_dot: 'bg-fuchsia-400',
      recommendation_icon: 'Star',
    },
  ]);
  expect(dependencies.query).toHaveBeenCalledExactlyOnceWith(expect.any(String), [
    'fixture-season',
  ]);
});

it('preserves missing-stat and zero-probability fallbacks', async () => {
  dependencies.probabilities.mockResolvedValue({ 7: 0 });
  dependencies.counts.mockResolvedValue({ 7: 0 });
  dependencies.query.mockResolvedValue({
    rows: [
      {
        player_id: 9,
        team_id: 7,
        price: '0',
        total_points: null,
        season_avg: null,
        min_points: null,
        max_points: null,
        games_played: null,
        price_trend: null,
      },
    ],
  });
  expect((await getCurrentMarketListings())[0]).toMatchObject({
    recommendation_score: 12,
    recommendation_label: 'Evitar',
    recommendation_icon: 'TrendingDown',
    recent_scores: null,
    value_score: 0,
    avg_recent_points: 0,
    season_avg: 0,
    total_points: 0,
  });
});

it('starts helper reads before listing SQL, with no added cache', async () => {
  await getCurrentMarketListings();
  await getCurrentMarketListings();
  expect(dependencies.season).toHaveBeenCalledTimes(2);
  expect(dependencies.query).toHaveBeenCalledTimes(2);
  for (const helper of [dependencies.probabilities, dependencies.counts, dependencies.form]) {
    expect(helper).toHaveBeenCalledTimes(2);
    expect(helper.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.query.mock.invocationCallOrder[0]
    );
  }
});

it('does not run listing SQL if a required helper rejects', async () => {
  dependencies.form.mockRejectedValue(new Error('fixture form failure'));
  await expect(getCurrentMarketListings()).rejects.toThrow('fixture form failure');
  expect(dependencies.query).not.toHaveBeenCalled();
});

it('retains score, trend, price ordering and stable complete ties', async () => {
  dependencies.form.mockResolvedValue(
    new Map(
      [1, 2, 3, 4].map((id) => [
        id,
        {
          recent_scores: '18',
          avg_recent_points: 18,
          avg_form_score: 18,
        },
      ])
    )
  );
  dependencies.query.mockResolvedValue({
    rows: [
      { ...strongPlayer, player_id: 1 },
      { ...strongPlayer, player_id: 2, price: '2000000', total_points: '200' },
      { ...strongPlayer, player_id: 4, price: '2000000', total_points: '200' },
      { ...strongPlayer, player_id: 3, price_trend: '60000' },
    ],
  });
  expect((await getCurrentMarketListings()).map((row) => row.player_id)).toEqual([3, 2, 4, 1]);
});
