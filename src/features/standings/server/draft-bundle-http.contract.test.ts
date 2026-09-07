import { expect, it, vi, describe, beforeEach, afterEach } from 'vitest';
import { GET, dynamic } from '@/app/api/standings/initial-squad-stats/route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: async () => 1 }));

const mockQuery = vi.fn();
vi.mock('@/lib/db', () => ({
  pgClient: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
  db: {},
}));

// The seven queries are called via Promise.all in order.
// Each pgClient.query call corresponds to one of the seven queries.
function mockAllSevenQueries(overrides: Partial<Record<string, unknown[]>> = {}) {
  const defaults: Record<string, unknown[]> = {
    bestDraftPerUser: [
      {
        user_id: '007',
        user_name: null,
        user_color_index: 0,
        icon: null,
        player_name: 'LeBron',
        player_id: '42',
        total_fantasy_points: '150.5',
      },
      {
        user_id: 'manager-x',
        user_name: 'Alice',
        user_color_index: 3,
        icon: '',
        player_name: 'Curry',
        player_id: '7',
        total_fantasy_points: '0',
      },
    ],
    retainedRanking: [
      {
        user_id: '1',
        user_name: 'Bob',
        user_color_index: 2,
        icon: 'hat.png',
        players_contributed: '5',
        total_points: '-10.5',
      },
    ],
    retainedBreakdown: [
      {
        user_id: '1',
        user_name: null,
        icon: null,
        player_name: 'Jokic',
        points: '33.3',
      },
    ],
    regretRanking: [
      {
        user_id: '1',
        user_name: 'Charlie',
        user_color_index: 1,
        icon: null,
        points_lost: '45.2',
        top_regret_player: null,
      },
    ],
    loyaltyRanking: [
      {
        user_id: '1',
        user_name: null,
        user_color_index: 0,
        icon: '',
        retained_count: '3',
        initial_count: '5',
        loyalty_percentage: '60.0',
      },
    ],
    potentialRanking: [
      {
        user_id: '1',
        user_name: 'Dave',
        user_color_index: 4,
        icon: null,
        total_points: '-5',
        total_value: '0',
      },
    ],
    detailedSquads: [
      {
        user_id: '0042',
        manager_name: 'Team A',
        manager_color_index: 2,
        player_id: 100,
        player_name: 'Doncic',
        player_position: 'G',
        current_points: '500',
        current_price: '12000',
        current_owner_id: '007',
        current_owner: 'Owner X',
        current_owner_color_index: 3,
        points_contributed: '250.5',
      },
    ],
  };

  const merged = { ...defaults, ...overrides };
  const keys = [
    'bestDraftPerUser',
    'retainedRanking',
    'retainedBreakdown',
    'regretRanking',
    'loyaltyRanking',
    'potentialRanking',
    'detailedSquads',
  ];
  for (const key of keys) {
    mockQuery.mockResolvedValueOnce({ rows: merged[key] });
  }
}

describe('GET /api/standings/initial-squad-stats', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('keeps dynamic declaration unchanged', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns seven populated arrays with exact JSON values and headers', async () => {
    mockAllSevenQueries();

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Object.keys(json.data)).toEqual([
      'bestDraftPerUser',
      'retainedRanking',
      'retainedBreakdown',
      'regretRanking',
      'loyaltyRanking',
      'potentialRanking',
      'detailedSquads',
    ]);
    expect(mockQuery).toHaveBeenCalledTimes(7);
    for (const [, params] of mockQuery.mock.calls) expect(params).toEqual([1]);

    // bestDraftPerUser — query does parseInt(player_id) and parseFloat(total_fantasy_points)
    expect(json.data.bestDraftPerUser).toEqual([
      {
        user_id: '007',
        user_name: null,
        user_color_index: 0,
        icon: null,
        player_name: 'LeBron',
        player_id: 42,
        total_fantasy_points: 150.5,
      },
      {
        user_id: 'manager-x',
        user_name: 'Alice',
        user_color_index: 3,
        icon: '',
        player_name: 'Curry',
        player_id: 7,
        total_fantasy_points: 0,
      },
    ]);

    // retainedRanking — query does parseInt(players_contributed) and parseFloat(total_points)
    expect(json.data.retainedRanking).toEqual([
      {
        user_id: '1',
        user_name: 'Bob',
        user_color_index: 2,
        icon: 'hat.png',
        players_contributed: 5,
        total_points: -10.5,
      },
    ]);

    // retainedBreakdown — query does parseFloat(points)
    expect(json.data.retainedBreakdown).toEqual([
      {
        user_id: '1',
        user_name: null,
        icon: null,
        player_name: 'Jokic',
        points: 33.3,
      },
    ]);

    // regretRanking — query does parseFloat(points_lost)
    expect(json.data.regretRanking).toEqual([
      {
        user_id: '1',
        user_name: 'Charlie',
        user_color_index: 1,
        icon: null,
        points_lost: 45.2,
        top_regret_player: null,
      },
    ]);

    // loyaltyRanking — query does parseInt(retained_count), parseInt(initial_count), parseFloat(loyalty_percentage)
    expect(json.data.loyaltyRanking).toEqual([
      {
        user_id: '1',
        user_name: null,
        user_color_index: 0,
        icon: '',
        retained_count: 3,
        initial_count: 5,
        loyalty_percentage: 60.0,
      },
    ]);

    // potentialRanking — query does parseFloat(total_points), parseFloat(total_value)
    expect(json.data.potentialRanking).toEqual([
      {
        user_id: '1',
        user_name: 'Dave',
        user_color_index: 4,
        icon: null,
        total_points: -5,
        total_value: 0,
      },
    ]);

    // detailedSquads — query does parseFloat(current_points), parseFloat(current_price), parseFloat(points_contributed)
    expect(json.data.detailedSquads).toEqual([
      {
        user_id: '0042',
        manager_name: 'Team A',
        manager_color_index: 2,
        player_id: 100,
        player_name: 'Doncic',
        player_position: 'G',
        current_points: 500,
        current_price: 12000,
        current_owner_id: '007',
        current_owner: 'Owner X',
        current_owner_color_index: 3,
        points_contributed: 250.5,
      },
    ]);
  });

  it('returns all-empty arrays', async () => {
    for (let i = 0; i < 7; i++) {
      mockQuery.mockResolvedValueOnce({ rows: [] });
    }

    const response = await GET();
    const json = await response.json();
    expect(json).toEqual({
      success: true,
      data: {
        bestDraftPerUser: [],
        retainedRanking: [],
        retainedBreakdown: [],
        regretRanking: [],
        loyaltyRanking: [],
        potentialRanking: [],
        detailedSquads: [],
      },
    });
  });

  it('returns mixed empty/populated collections', async () => {
    mockAllSevenQueries({
      bestDraftPerUser: [],
      retainedBreakdown: [],
      loyaltyRanking: [],
      detailedSquads: [],
    });

    const response = await GET();
    const json = await response.json();
    expect(json.data.bestDraftPerUser).toEqual([]);
    expect(json.data.retainedRanking).toHaveLength(1);
    expect(json.data.retainedBreakdown).toEqual([]);
    expect(json.data.regretRanking).toHaveLength(1);
    expect(json.data.loyaltyRanking).toEqual([]);
    expect(json.data.potentialRanking).toHaveLength(1);
    expect(json.data.detailedSquads).toEqual([]);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([0, 1, 2, 3, 4, 5, 6])(
    'query %i rejection produces unchanged 500',
    async (failedIndex) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      for (let index = 0; index < 7; index++) {
        if (index === failedIndex) mockQuery.mockRejectedValueOnce(new Error('synthetic failure'));
        else mockQuery.mockResolvedValueOnce({ rows: [] });
      }

      const response = await GET();
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ success: false, error: 'Internal Server Error' });
      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-store, max-age=0, must-revalidate'
      );
    }
  );
});
