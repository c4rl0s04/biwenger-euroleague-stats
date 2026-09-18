import { expect, it } from 'vitest';

// Exact clamp and label-boundary examples captured from the same original implementation.
const presentationCases = [
  {
    input: {
      min_points: -10,
      max_points: -30,
      season_avg: -16,
      avg_recent_points: 0,
      games_played: 0,
      value_score: 0,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 0,
      recommendation_label: 'Evitar',
      recommendation_color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      recommendation_dot: 'bg-rose-400',
      recommendation_icon: 'TrendingDown',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: -30,
      season_avg: 0,
      avg_recent_points: 0,
      games_played: 10,
      value_score: 100,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 29,
      recommendation_label: 'Evitar',
      recommendation_color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      recommendation_dot: 'bg-rose-400',
      recommendation_icon: 'TrendingDown',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: -30,
      season_avg: 0,
      avg_recent_points: 10,
      games_played: 10,
      value_score: 50,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 30,
      recommendation_label: 'Compra Arriesgada',
      recommendation_color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      recommendation_dot: 'bg-orange-400',
      recommendation_icon: 'TrendingDown',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: -30,
      season_avg: 16,
      avg_recent_points: 18,
      games_played: 10,
      value_score: 0,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 50,
      recommendation_label: 'Compra Normal',
      recommendation_color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      recommendation_dot: 'bg-amber-400',
      recommendation_icon: 'Activity',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: 0,
      season_avg: 10,
      avg_recent_points: 18,
      games_played: 3,
      value_score: 0,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 49,
      recommendation_label: 'Compra Arriesgada',
      recommendation_color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      recommendation_dot: 'bg-orange-400',
      recommendation_icon: 'TrendingDown',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: 0,
      season_avg: 16,
      avg_recent_points: 18,
      games_played: 10,
      value_score: 100,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 75,
      recommendation_label: 'Compra Excelente',
      recommendation_color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      recommendation_dot: 'bg-emerald-400',
      recommendation_icon: 'TrendingUp',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: 30,
      season_avg: 10,
      avg_recent_points: 18,
      games_played: 3,
      value_score: 100,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 74,
      recommendation_label: 'Compra Normal',
      recommendation_color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      recommendation_dot: 'bg-amber-400',
      recommendation_icon: 'Activity',
    },
  },
  {
    input: {
      min_points: -10,
      max_points: 30,
      season_avg: 16,
      avg_recent_points: 18,
      games_played: 10,
      value_score: 50,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 85,
      recommendation_label: 'Fichaje Obligatorio',
      recommendation_color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
      recommendation_dot: 'bg-fuchsia-400',
      recommendation_icon: 'Star',
    },
  },
  {
    input: {
      min_points: 10,
      max_points: 30,
      season_avg: 10,
      avg_recent_points: 18,
      games_played: 3,
      value_score: 100,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 84,
      recommendation_label: 'Compra Excelente',
      recommendation_color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      recommendation_dot: 'bg-emerald-400',
      recommendation_icon: 'TrendingUp',
    },
  },
  {
    input: {
      min_points: 10,
      max_points: 30,
      season_avg: 16,
      avg_recent_points: 18,
      games_played: 10,
      value_score: 100,
      team_id: 7,
      price_trend: 50001,
      price: '1000000',
      total_points: '100',
    },
    expected: {
      recommendation_score: 100,
      recommendation_label: 'Fichaje Obligatorio',
      recommendation_color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
      recommendation_dot: 'bg-fuchsia-400',
      recommendation_icon: 'Star',
    },
  },
];
it.each(presentationCases)(
  'retains presentation at score $expected.recommendation_score',
  ({ input, expected }) => {
    expect(scoreMarketListing(input, { 7: 10 }, { 7: 99 })).toMatchObject(expected);
  }
);

import { scoreMarketListing, type MarketRecommendationInput } from './market-recommendation';

const base: MarketRecommendationInput = {
  min_points: 5,
  max_points: 20,
  games_played: 10,
  team_id: 7,
  season_avg: 10,
  avg_recent_points: 10,
  value_score: 50,
  price_trend: 0,
  price: '1000000',
  total_points: '100',
};

// Frozen outputs evaluated from ecb06da3's unmodified getCurrentMarketListings calculation.
// Never regenerate these from the extracted implementation to make a failing test pass.
const originalScores: [keyof MarketRecommendationInput, number | string | null, number][] = [
  ['min_points', -1, 57],
  ['min_points', 0, 57],
  ['min_points', 1, 58],
  ['min_points', 9, 66],
  ['min_points', 10, 67],
  ['min_points', 11, 67],
  ['max_points', -1, 51],
  ['max_points', 0, 52],
  ['max_points', 29, 66],
  ['max_points', 30, 67],
  ['max_points', 31, 67],
  ['games_played', 0, 48],
  ['games_played', 2, 50],
  ['games_played', 3, 55],
  ['games_played', 10, 62],
  ['games_played', 11, 62],
  ['season_avg', -1, 50],
  ['season_avg', 0, 52],
  ['season_avg', 15.9, 65],
  ['season_avg', 16, 62],
  ['season_avg', 16.1, 62],
  ['avg_recent_points', 3.9, 53],
  ['avg_recent_points', 4, 53],
  ['avg_recent_points', 7, 56],
  ['avg_recent_points', 9.9, 59],
  ['avg_recent_points', 10, 62],
  ['avg_recent_points', 12.9, 62],
  ['avg_recent_points', 13, 65],
  ['avg_recent_points', 14, 65],
  ['avg_recent_points', 17.9, 68],
  ['avg_recent_points', 18, 68],
  ['value_score', -1, 57],
  ['value_score', 0, 57],
  ['value_score', 99, 67],
  ['value_score', 100, 67],
  ['value_score', 101, 67],
  ['price_trend', -50001, 60],
  ['price_trend', -50000, 61],
  ['price_trend', -1, 61],
  ['price_trend', 0, 62],
  ['price_trend', 1, 64],
  ['price_trend', 50000, 64],
  ['price_trend', 50001, 65],
  ['team_id', null, 62],
  ['team_id', 0, 62],
  ['team_id', 7, 62],
  ['team_id', '7abc', 62],
];

it.each(originalScores)('preserves original %s=%s score', (field, value, expected) => {
  expect(
    scoreMarketListing({ ...base, [field]: value }, { 7: 10 }, { 7: 50 }).recommendation_score
  ).toBe(expected);
});

it('normalizes selected numeric outputs without mutating or spreading input fields', () => {
  const input = Object.freeze({
    ...base,
    price: '7abc',
    season_avg: '4.25',
    total_points: null,
    unrelated: 'not part of the model',
  });
  const output = scoreMarketListing(input, Object.freeze({ 7: 10 }), Object.freeze({ 7: 50 }));
  expect(output).toMatchObject({ price: 7, season_avg: 4.25, total_points: 0 });
  expect(output).not.toHaveProperty('unrelated');
  expect(input.price).toBe('7abc');
});

it('retains NaN for an unparseable price instead of silently changing the legacy contract', () => {
  expect(scoreMarketListing({ ...base, price: null }, {}, {}).price).toBeNaN();
});
