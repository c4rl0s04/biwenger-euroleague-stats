import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeHomeFeedCursor } from '@/lib/home/cursor';

const {
  queryHomeActivityRows,
  queryHomeSeasonMetadata,
  getCurrentRoundState,
  getPersonalizedAlerts,
  getAppStandings,
} = vi.hoisted(() => ({
  queryHomeActivityRows: vi.fn(),
  queryHomeSeasonMetadata: vi.fn(),
  getCurrentRoundState: vi.fn(),
  getPersonalizedAlerts: vi.fn(),
  getAppStandings: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/queries/features/home-feed', () => ({
  queryHomeActivityRows,
}));
vi.mock('@/lib/db/queries/features/home-summary', () => ({ queryHomeSeasonMetadata }));
vi.mock('@/lib/db/queries/competition/rounds', () => ({ getCurrentRoundState }));
vi.mock('@/lib/db/queries/core/users', () => ({ getPersonalizedAlerts }));
vi.mock('./appShellService', () => ({ getAppStandings }));

import { getHomeFeedPage, getHomeSummary } from './homeService';

const transferRow = (id: number) => ({
  id: `transfer:${id}`,
  type: 'transfer',
  occurred_at: new Date(Date.UTC(2026, 9, 20, 20, 0, 20 - id)).toISOString(),
  payload: {
    playerId: 1000 + id,
    playerName: `Jugador ${id}`,
    position: 'Base',
    playerImage: null,
    teamCode: 'RMB',
    sellerId: null,
    sellerName: 'Mercado',
    buyerId: '7',
    buyerName: 'All Stars',
    amount: String(id * 100000),
  },
});

describe('mobile home feed service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns fifteen normalized events and a cursor when more activity exists', async () => {
    queryHomeActivityRows.mockResolvedValue(
      Array.from({ length: 16 }, (_, index) => transferRow(index + 1))
    );

    const page = await getHomeFeedPage();

    expect(page.items).toHaveLength(15);
    expect(page.items[0]).toMatchObject({
      id: 'transfer:1',
      type: 'transfer',
      amount: 100000,
      buyer: { id: '7', name: 'All Stars' },
    });
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeHomeFeedCursor(page.nextCursor!)).toEqual({
      occurredAt: transferRow(15).occurred_at,
      id: 'transfer:15',
    });
  });

  it('normalizes grouped round, administrative bonus, and match session events', async () => {
    queryHomeActivityRows.mockResolvedValue([
      {
        id: 'round_completed:4',
        type: 'round_completed',
        occurred_at: '2026-10-10T21:00:00.000Z',
        payload: {
          roundId: 4,
          roundName: 'Jornada 4',
          totalBonus: '2100000',
          participants: [
            {
              userId: '1',
              name: 'June',
              icon: null,
              colorIndex: 2,
              position: 1,
              points: 201,
              bonus: '300000',
            },
          ],
        },
      },
      {
        id: 'admin_bonus:abc123',
        type: 'admin_bonus',
        occurred_at: '2026-10-09T10:00:00.000Z',
        payload: {
          recipientId: '1',
          recipientName: 'June',
          icon: null,
          colorIndex: 2,
          amount: '500000',
          description: 'Premio especial',
        },
      },
      {
        id: 'match_session:4:2026-10-08',
        type: 'match_session',
        occurred_at: '2026-10-08T21:00:00.000Z',
        payload: {
          roundId: 4,
          roundName: 'Jornada 4',
          sessionDate: '2026-10-08',
          matches: [
            {
              id: 44,
              homeId: 1,
              homeName: 'Madrid',
              homeCode: 'RMB',
              homeImage: null,
              homeScore: 90,
              awayId: 2,
              awayName: 'París',
              awayCode: 'PAR',
              awayImage: null,
              awayScore: 84,
            },
          ],
        },
      },
    ]);

    const page = await getHomeFeedPage();

    expect(page).toMatchObject({ hasMore: false, nextCursor: null });
    expect(page.items).toEqual([
      expect.objectContaining({ type: 'round_completed', totalBonus: 2100000 }),
      expect.objectContaining({ type: 'admin_bonus', amount: 500000 }),
      expect.objectContaining({
        type: 'match_session',
        matches: [expect.objectContaining({ home: expect.objectContaining({ score: 90 }) })],
      }),
    ]);
  });

  it('keeps an empty configured season in preseason without historical fallback', async () => {
    queryHomeSeasonMetadata.mockResolvedValue({
      id: '2026-27',
      name: 'Temporada 2026/27',
      status: 'active',
      completedRounds: 0,
    });
    getAppStandings.mockResolvedValue([
      {
        user_id: '7',
        name: 'All Stars',
        rounds_played: 0,
        position: 1,
        total_points: 0,
        team_value: 40000000,
        price_trend: 0,
      },
    ]);
    getCurrentRoundState.mockResolvedValue({ currentRound: null, nextRound: null });
    getPersonalizedAlerts.mockResolvedValue([]);

    const summary = await getHomeSummary('7');

    expect(summary).toMatchObject({
      seasonId: '2026-27',
      phase: 'preseason',
      user: { name: 'All Stars', position: null, teamValue: 40000000 },
      round: { status: 'unavailable' },
    });
  });

  it('maps the active round and personal pulse from shared standings', async () => {
    queryHomeSeasonMetadata.mockResolvedValue({
      id: '2026-27',
      name: 'Temporada 2026/27',
      status: 'active',
      completedRounds: 3,
    });
    getAppStandings.mockResolvedValue([
      {
        user_id: '7',
        name: 'All Stars',
        rounds_played: 3,
        position: 2,
        total_points: 512,
        team_value: 42500000,
        price_trend: 350000,
      },
    ]);
    getCurrentRoundState.mockResolvedValue({
      currentRound: {
        round_id: 4,
        round_name: 'Jornada 4',
        status_calc: 'live',
        start_date: '2026-10-15T18:00:00.000Z',
      },
      nextRound: null,
    });
    getPersonalizedAlerts.mockResolvedValue([
      { type: 'price_gain', message: 'Subida de valor', severity: 'success' },
    ]);

    const summary = await getHomeSummary('7');

    expect(summary).toMatchObject({
      phase: 'active',
      user: { position: 2, totalPoints: 512, priceTrend: 350000 },
      round: { id: 4, name: 'Jornada 4', status: 'live' },
      alerts: [{ type: 'price_gain', message: 'Subida de valor' }],
    });
  });
});
