import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/utils/cache', () => ({
  cached: async (_key: string, _ttl: number, fn: () => Promise<any>) => fn(),
  CACHE_TTL: { VERY_LONG: 86400 },
}));

const mockRawData = {
  users: [
    { id: 'u1', name: 'User One', color_index: 0 },
    { id: 'u2', name: 'User Two', color_index: 1 },
  ],
  userRounds: [
    {
      user_id: 'u1',
      round_id: 1,
      round_name: 'J1',
      points: 40,
      participated: true,
      round_date: '2025-10-01',
    },
    {
      user_id: 'u2',
      round_id: 1,
      round_name: 'J1',
      points: 20,
      participated: true,
      round_date: '2025-10-01',
    },
    {
      user_id: 'u1',
      round_id: 2,
      round_name: 'J2',
      points: 50,
      participated: true,
      round_date: '2025-10-08',
    },
    {
      user_id: 'u2',
      round_id: 2,
      round_name: 'J2',
      points: 30,
      participated: true,
      round_date: '2025-10-08',
    },
  ],
  lineups: [
    { user_id: 'u1', round_id: 1, player_id: 1 },
    { user_id: 'u2', round_id: 1, player_id: 2 },
  ],
  playerStats: [
    { round_id: 1, player_id: 1, fantasy_points: 40, position: 'guard' },
    { round_id: 1, player_id: 2, fantasy_points: 20, position: 'forward' },
  ],
  finances: [
    {
      user_id: 'u1',
      round_id: 1,
      date: '2025-10-01',
      type: 'round_bonus',
      amount: 100000,
      description: 'Prize',
    },
    {
      user_id: 'u2',
      round_id: 1,
      date: '2025-10-01',
      type: 'round_bonus',
      amount: 50000,
      description: 'Prize',
    },
  ],
  initialSquads: [
    { user_id: 'u1', player_id: 1, price: 10000000 },
    { user_id: 'u2', player_id: 2, price: 8000000 },
  ],
  transfers: [
    {
      id: 1,
      timestamp: 1700000000,
      fecha: '2025-09-28',
      player_id: 1,
      precio: 10000000,
      vendedor: 'Computer',
      comprador: 'User One',
    },
  ],
  marketValues: [
    { date: '2025-09-27', player_id: 1, price: 10000000 },
    { date: '2025-09-27', player_id: 2, price: 8000000 },
    { date: '2025-10-01', player_id: 1, price: 11000000 },
    { date: '2025-10-01', player_id: 2, price: 8000000 },
    { date: '2025-10-08', player_id: 1, price: 12000000 },
    { date: '2025-10-08', player_id: 2, price: 8500000 },
  ],
  marketListings: [{ listed_at: '2025-10-01', automatic: 10, total: 10 }],
  marketListingPlayers: [
    { listed_at: '2025-10-01', player_id: 1, price: 10000000, seller_id: null },
  ],
  transferBids: [{ transfer_id: 1, bidder_id: 'u1', bidder_name: 'User One', amount: 10000000 }],
  counts: {
    rawFinanceRows: 2,
    uniqueFinanceEvents: 2,
    transfers: 1,
    initialSquadRows: 2,
    marketValueRows: 6,
    marketSnapshotDays: 3,
    totalPlayers: 2,
  },
};

vi.mock('../queries/season-review-raw.query', () => ({
  getSeasonReviewRawData: vi.fn(async () => mockRawData),
}));

import {
  HISTORICAL_RESILIENCE_CONFIG,
  DEFAULT_RECOVERY_SHOCK,
  sameConfig,
  sameShock,
  readSeasonSimulationAnalysis,
  getSeasonResilienceOverview,
  getSeasonReviewPageData,
} from './season-review.service';

describe('season-review.service', () => {
  it('identifies identical and differing configs and shocks', () => {
    expect(sameConfig(HISTORICAL_RESILIENCE_CONFIG, { ...HISTORICAL_RESILIENCE_CONFIG })).toBe(
      true
    );
    expect(
      sameConfig(HISTORICAL_RESILIENCE_CONFIG, {
        ...HISTORICAL_RESILIENCE_CONFIG,
        rosterCap: 15,
      })
    ).toBe(false);

    expect(sameShock(DEFAULT_RECOVERY_SHOCK, { ...DEFAULT_RECOVERY_SHOCK })).toBe(true);
    expect(sameShock(DEFAULT_RECOVERY_SHOCK, { ...DEFAULT_RECOVERY_SHOCK, severity: 'high' })).toBe(
      false
    );
  });

  it('reads simulation analysis JSON artifact correctly', async () => {
    const analysis = await readSeasonSimulationAnalysis();
    expect(analysis).toBeDefined();
    expect(analysis.version).toBe(4);
    expect(analysis.configurations).toBeDefined();
  });

  it('builds season resilience overview with correct schema and computed metrics', async () => {
    const overview = await getSeasonResilienceOverview();
    expect(overview.version).toBe(2);
    expect(overview.seasonId).toBe('2025-26');
    expect(overview.users).toHaveLength(2);
    expect(overview.timeline.length).toBeGreaterThan(0);
    expect(overview.autopsy).toBeDefined();
    expect(overview.autopsy.leaderId).toBe('u1');
    expect(overview.autopsy.laggardId).toBe('u2');
    expect(overview.recommendations.length).toBeGreaterThan(0);
    expect(overview.quality.transfers).toBe(1);
  });

  it('loads page data combining overview and simulation analysis', async () => {
    const pageData = await getSeasonReviewPageData();
    expect(pageData.overview).toBeDefined();
    expect(pageData.simulationAnalysis).toBeDefined();
    expect(pageData.overview.seasonId).toBe('2025-26');
  });
});
