import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeHomeFeedCursor } from '@/lib/home/cursor';

const {
  queryHomeActivityRows,
  queryHomeRoundHighlightPlayers,
  queryHomeSeasonMetadata,
  getCurrentRoundState,
  getPersonalizedAlerts,
  getAppStandings,
} = vi.hoisted(() => ({
  queryHomeActivityRows: vi.fn(),
  queryHomeRoundHighlightPlayers: vi.fn(),
  queryHomeSeasonMetadata: vi.fn(),
  getCurrentRoundState: vi.fn(),
  getPersonalizedAlerts: vi.fn(),
  getAppStandings: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/queries/features/home-feed', () => ({
  queryHomeActivityRows,
  queryHomeRoundHighlightPlayers,
}));
vi.mock('@/lib/db/queries/features/home-summary', () => ({ queryHomeSeasonMetadata }));
vi.mock('@/lib/db/queries/competition/rounds', () => ({ getCurrentRoundState }));
vi.mock('@/lib/db/queries/core/users', () => ({ getPersonalizedAlerts }));
vi.mock('./appShellService', () => ({ getAppStandings }));

import { getHomeFeedPage, getHomeSummary } from './homeService';

const transferDayRow = (id: number) => ({
  id: `transfer_day:2026-10-${String(id).padStart(2, '0')}`,
  type: 'transfer_day',
  occurred_at: new Date(Date.UTC(2026, 9, 20, 20, 0, 20 - id)).toISOString(),
  payload: {
    date: `2026-10-${String(id).padStart(2, '0')}`,
    transfers: [
      {
        id: `transfer:${id}`,
        occurredAt: new Date(Date.UTC(2026, 9, 20, 20, 0, 20 - id)).toISOString(),
        playerId: 1000 + id,
        playerName: `Jugador ${id}`,
        position: 'Base',
        playerImage: null,
        teamCode: 'RMB',
        sellerId: null,
        sellerName: 'Mercado',
        sellerIcon: null,
        sellerColorIndex: 0,
        buyerId: '7',
        buyerName: 'All Stars',
        buyerIcon: 'https://example.com/all-stars.png',
        buyerColorIndex: 4,
        amount: String(id * 100000),
        marketValue: String(id * 90_000),
        marketValueAt: '2026-10-20',
      },
    ],
  },
});

describe('mobile home feed service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryHomeRoundHighlightPlayers.mockResolvedValue([]);
  });

  it('returns fifteen normalized events and a cursor when more activity exists', async () => {
    queryHomeActivityRows.mockResolvedValue(
      Array.from({ length: 16 }, (_, index) => transferDayRow(index + 1))
    );

    const page = await getHomeFeedPage({ filter: 'transfers' });

    expect(page.items).toHaveLength(15);
    expect(page.items[0]).toMatchObject({
      id: 'transfer_day:2026-10-01',
      type: 'transfer_day',
      date: '2026-10-01',
      transfers: [
        expect.objectContaining({
          id: 'transfer:1',
          amount: 100000,
          marketValue: 90000,
          marketValueAt: '2026-10-20',
          buyer: expect.objectContaining({ id: '7', name: 'All Stars', colorIndex: 4 }),
        }),
      ],
    });
    expect(queryHomeActivityRows).toHaveBeenCalledWith({
      cursor: null,
      filter: 'transfers',
      limit: 16,
    });
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeHomeFeedCursor(page.nextCursor!, 'transfers')).toEqual({
      occurredAt: transferDayRow(15).occurred_at,
      id: 'transfer_day:2026-10-15',
      filter: 'transfers',
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

    const page = await getHomeFeedPage({ filter: 'all' });

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

  it('normalizes a completed prediction round with complete, partial, and absent managers', async () => {
    queryHomeActivityRows.mockResolvedValue([
      {
        id: 'prediction_round:4',
        type: 'prediction_round',
        occurred_at: '2026-10-10T21:00:00.000Z',
        payload: {
          roundId: 4,
          roundName: 'Jornada 4',
          totalMatches: 3,
          actualResults: ['1', 'X', '2'],
          participants: [
            {
              userId: '1',
              name: 'June',
              icon: null,
              colorIndex: 2,
              participation: 'complete',
              hits: 2,
              position: 1,
              userMatches: 3,
              predictions: ['1', '2', '2'],
            },
            {
              userId: '2',
              name: 'All Stars',
              icon: null,
              colorIndex: 3,
              participation: 'partial',
              hits: 1,
              position: null,
              userMatches: 2,
              predictions: ['1', 'X'],
            },
            {
              userId: '3',
              name: 'No Name Yet',
              icon: null,
              colorIndex: 4,
              participation: 'absent',
              hits: 0,
              position: null,
              userMatches: 0,
              predictions: [],
            },
          ],
        },
      },
    ]);

    const page = await getHomeFeedPage({ filter: 'predictions' });

    expect(page.items).toEqual([
      expect.objectContaining({
        type: 'prediction_round',
        roundId: 4,
        actualResults: ['1', 'X', '2'],
        participants: [
          expect.objectContaining({ name: 'June', participation: 'complete', position: 1 }),
          expect.objectContaining({ name: 'All Stars', participation: 'partial', position: null }),
          expect.objectContaining({ name: 'No Name Yet', participation: 'absent', position: null }),
        ],
      }),
    ]);
  });

  it('enriches every visible highlight with one batched player-stat query and keeps tied MVPs', async () => {
    queryHomeActivityRows.mockResolvedValue([
      {
        id: 'round_highlight:4',
        type: 'round_highlight',
        occurred_at: '2026-10-10T21:00:00.000Z',
        payload: { roundId: 4, roundName: 'Jornada 4' },
      },
    ]);
    queryHomeRoundHighlightPlayers.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        round_id: 4,
        player_id: 10 + index,
        name: `Jugador ${index + 1}`,
        position: index < 3 ? 'Base' : index < 7 ? 'Alero' : 'Pivot',
        img: index === 0 ? 'https://example.com/mvp.png' : null,
        team_short: 'RMB',
        points: index < 2 ? 30 : 29 - index,
        valuation: 20 - index,
      }))
    );

    const page = await getHomeFeedPage({ filter: 'rounds' });

    expect(queryHomeRoundHighlightPlayers).toHaveBeenCalledWith([4]);
    expect(page.items).toEqual([
      expect.objectContaining({
        type: 'round_highlight',
        roundId: 4,
        mvps: [expect.objectContaining({ id: 10 }), expect.objectContaining({ id: 11 })],
        idealLineup: expect.arrayContaining([
          expect.objectContaining({ id: 10, role: 'titular', multiplier: 2 }),
          expect.objectContaining({ role: '6th_man', multiplier: 0.75 }),
        ]),
      }),
    ]);
  });

  it('keeps every transfer inside a busy market day', async () => {
    const row = transferDayRow(1);
    row.payload.transfers = Array.from({ length: 20 }, (_, index) => ({
      ...row.payload.transfers[0],
      id: `transfer:${20 - index}`,
      playerId: 2000 + index,
      playerName: `Jugador ${20 - index}`,
      amount: String((20 - index) * 100000),
    }));
    queryHomeActivityRows.mockResolvedValue([row]);

    const page = await getHomeFeedPage({ filter: 'transfers' });
    const event = page.items[0];

    expect(event).toMatchObject({ type: 'transfer_day' });
    if (event.type !== 'transfer_day') throw new Error('Expected transfer day');
    expect(event.transfers).toHaveLength(20);
    expect(event.transfers[0].id).toBe('transfer:20');
    expect(event.transfers[19].id).toBe('transfer:1');
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
