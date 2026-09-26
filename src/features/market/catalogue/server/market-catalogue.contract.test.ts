import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({
  query: vi.fn(),
  season: vi.fn(),
  form: vi.fn(),
  counts: vi.fn(),
  probabilities: vi.fn(),
}));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query }, pgClient: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
vi.mock('@/features/players/server', () => ({ getPlayerFormStats: fake.form }));
vi.mock('@/features/teams/server', () => ({
  getAllTeamMatchesCount: fake.counts,
  getAllTeamsPlayoffProbabilities: fake.probabilities,
}));
import {
  getCurrentMarketListings,
  getMarketOpportunities,
  MARKET_CATALOGUE_POLICY,
} from './services/market-catalogue.service';

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.form.mockResolvedValue([]);
  fake.counts.mockResolvedValue({});
  fake.probabilities.mockResolvedValue({});
  fake.query.mockResolvedValue({ rows: [] });
});

it('allowlists catalogue output and serializes dates without changing existing JSON values', async () => {
  const row = Object.freeze({
    player_id: 7,
    name: 'Fixture',
    img: null,
    position: null,
    team_id: null,
    team: null,
    team_img: null,
    price: 1000000,
    real_price: null,
    price_trend: 0,
    total_points: '100',
    season_avg: '10.0',
    min_points: '0',
    max_points: '20',
    games_played: '10',
    seller_id: '42',
    seller_name: 'Manager',
    seller_icon: null,
    seller_color: 0,
    player_team: null,
    next_opponent_id: null,
    next_opponent_name: null,
    next_opponent_img: null,
    next_match_date: new Date('2026-01-01T12:00:00.000Z'),
    credential: 'synthetic-canary',
  });
  fake.query.mockResolvedValue({ rows: [row] });
  const [result] = await getCurrentMarketListings();
  expect(result).toMatchObject({
    player_id: 7,
    seller_id: '42',
    real_price: null,
    min_points: '0',
    games_played: '10',
    price: 1000000,
    total_points: 100,
    season_avg: 10,
    recent_scores: null,
    next_match_date: '2026-01-01T12:00:00.000Z',
  });
  expect(result).not.toHaveProperty('credential');
  expect(JSON.stringify(result)).not.toContain('synthetic-canary');
  expect(fake.query).toHaveBeenCalledWith(expect.stringContaining('MAX(listed_at)'), [
    'fixture-season',
  ]);
  expect(fake.form).toHaveBeenCalledWith();
});

it('uses the penalized form for opportunities and excludes unrelated fields', async () => {
  fake.form.mockResolvedValue([
    { playerId: 7, recentScores: '30,X,30', averageRecentPoints: 30, formScore: 20 },
  ]);
  fake.query.mockResolvedValue({
    rows: [
      {
        player_id: 7,
        name: null,
        position: null,
        team_id: null,
        team: null,
        price: 2000000,
        price_trend: 0,
        credential: 'synthetic-canary',
      },
    ],
  });
  expect(await getMarketOpportunities(8)).toEqual([
    {
      player_id: 7,
      name: null,
      position: null,
      team_id: null,
      team: null,
      price: 2000000,
      price_trend: 0,
      avg_recent_points: 20,
      recent_scores: '30,X,30',
      value_score: 10,
    },
  ]);
  expect(fake.form).toHaveBeenCalledWith(3);
  expect(fake.counts).not.toHaveBeenCalled();
  expect(fake.probabilities).not.toHaveBeenCalled();
});

it('retains empty results, uncached reads and helper-before-SQL failure behavior', async () => {
  expect(await getCurrentMarketListings()).toEqual([]);
  expect(await getCurrentMarketListings()).toEqual([]);
  expect(fake.query).toHaveBeenCalledTimes(2);
  expect(MARKET_CATALOGUE_POLICY).toEqual({
    access: 'public-fantasy-statistics',
    identity: 'none',
    serverCache: 'none',
  });
  fake.counts.mockRejectedValue(new Error('fixture-count-failure'));
  await expect(getCurrentMarketListings()).rejects.toThrow('fixture-count-failure');
  expect(fake.query).toHaveBeenCalledTimes(2);
});

it('propagates season and query failures instead of returning a fabricated empty catalogue', async () => {
  fake.season.mockRejectedValueOnce(new Error('fixture-season-failure'));
  await expect(getMarketOpportunities()).rejects.toThrow('fixture-season-failure');
  expect(fake.query).not.toHaveBeenCalled();
  expect(fake.form).not.toHaveBeenCalled();
  fake.query.mockRejectedValue(new Error('fixture-query-failure'));
  await expect(getMarketOpportunities()).rejects.toThrow('fixture-query-failure');
  await expect(getCurrentMarketListings()).rejects.toThrow('fixture-query-failure');
});
