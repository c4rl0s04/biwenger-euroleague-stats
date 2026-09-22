import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  pgClient: {
    query: mocks.query,
  },
}));

import { getSeasonReviewRawData } from './season-review-raw.query';
import { REVIEW_SEASON_ID } from '../../models/types';

describe('getSeasonReviewRawData', () => {
  it('queries pgClient with the fixed seasonId and maps raw data structures correctly', async () => {
    mocks.query.mockImplementation(async (sql: string, params: any[]) => {
      expect(params).toEqual([REVIEW_SEASON_ID]);

      if (sql.includes('FROM user_seasons us')) {
        return { rows: [{ id: 'u1', name: 'User 1', color_index: 0 }] };
      }
      if (sql.includes('FROM user_rounds ur')) {
        return {
          rows: [
            {
              user_id: 'u1',
              round_id: 1,
              round_name: 'Jornada 1',
              points: 50,
              participated: true,
              round_date: '2025-10-01',
            },
          ],
        };
      }
      if (sql.includes('FROM lineups')) {
        return { rows: [{ user_id: 'u1', round_id: 1, player_id: 101 }] };
      }
      if (sql.includes('FROM player_round_stats prs')) {
        return {
          rows: [{ round_id: 1, player_id: 101, fantasy_points: 15, position: 'guard' }],
        };
      }
      if (sql.includes('FROM finances') && !sql.includes('SELECT COUNT(*)')) {
        return {
          rows: [
            {
              user_id: 'u1',
              round_id: 1,
              date: '2025-10-02',
              type: 'round_bonus',
              amount: 50000,
              description: 'Bonus round 1',
            },
          ],
        };
      }
      if (sql.includes('FROM initial_squads') && !sql.includes('SELECT COUNT(*)')) {
        return { rows: [{ user_id: 'u1', player_id: 101, price: 5000000 }] };
      }
      if (sql.includes('FROM fichajes') && !sql.includes('SELECT COUNT(*)')) {
        return {
          rows: [
            {
              id: 1,
              timestamp: 1700000000,
              fecha: '2025-10-05',
              player_id: 102,
              precio: 3000000,
              vendedor: 'User 2',
              comprador: 'User 1',
            },
          ],
        };
      }
      if (sql.includes('FROM market_values') && !sql.includes('SELECT COUNT(*)')) {
        return { rows: [{ date: '2025-10-01', player_id: 101, price: 5000000 }] };
      }
      if (
        sql.includes('seller_id') &&
        sql.includes('FROM market_listings') &&
        !sql.includes('GROUP BY')
      ) {
        return {
          rows: [{ listed_at: '2025-10-01', player_id: 101, price: 5000000, seller_id: null }],
        };
      }
      if (sql.includes('FROM transfer_bids tb')) {
        return {
          rows: [
            {
              transfer_id: 1,
              bidder_id: 'u1',
              bidder_name: 'User 1',
              amount: 3000000,
            },
          ],
        };
      }
      if (sql.includes('GROUP BY listed_at')) {
        return { rows: [{ listed_at: '2025-10-01', automatic: 10, total: 12 }] };
      }
      if (sql.includes('raw_finance_rows')) {
        return {
          rows: [
            {
              raw_finance_rows: '10',
              unique_finance_events: '8',
              transfers: '25',
              initial_squad_rows: '15',
              market_value_rows: '200',
              market_snapshot_days: '50',
              total_players: '120',
            },
          ],
        };
      }
      return { rows: [] };
    });

    const result = await getSeasonReviewRawData();

    expect(result.users).toHaveLength(1);
    expect(result.users[0].name).toBe('User 1');
    expect(result.userRounds).toHaveLength(1);
    expect(result.lineups).toHaveLength(1);
    expect(result.playerStats).toHaveLength(1);
    expect(result.finances).toHaveLength(1);
    expect(result.initialSquads).toHaveLength(1);
    expect(result.transfers).toHaveLength(1);
    expect(result.marketValues).toHaveLength(1);
    expect(result.marketListingPlayers).toHaveLength(1);
    expect(result.transferBids).toHaveLength(1);
    expect(result.marketListings).toHaveLength(1);

    expect(result.counts).toEqual({
      rawFinanceRows: 10,
      uniqueFinanceEvents: 8,
      transfers: 25,
      initialSquadRows: 15,
      marketValueRows: 200,
      marketSnapshotDays: 50,
      totalPlayers: 120,
    });
  });
});
