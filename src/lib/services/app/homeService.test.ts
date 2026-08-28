import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeHomeFeedCursor } from '@/lib/home/cursor';

const { queryHomeActivityRows } = vi.hoisted(() => ({
  queryHomeActivityRows: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/queries/features/home-feed', () => ({
  queryHomeActivityRows,
}));

import { getHomeFeedPage } from './homeService';

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
  beforeEach(() => queryHomeActivityRows.mockReset());

  it('returns fifteen normalized events and a cursor when more activity exists', async () => {
    queryHomeActivityRows.mockResolvedValue(Array.from({ length: 16 }, (_, index) => transferRow(index + 1)));

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
            { userId: '1', name: 'June', icon: null, colorIndex: 2, position: 1, points: 201, bonus: '300000' },
          ],
        },
      },
      {
        id: 'admin_bonus:abc123',
        type: 'admin_bonus',
        occurred_at: '2026-10-09T10:00:00.000Z',
        payload: {
          recipientId: '1', recipientName: 'June', icon: null, colorIndex: 2,
          amount: '500000', description: 'Premio especial',
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
          matches: [{
            id: 44,
            homeId: 1, homeName: 'Madrid', homeCode: 'RMB', homeImage: null, homeScore: 90,
            awayId: 2, awayName: 'París', awayCode: 'PAR', awayImage: null, awayScore: 84,
          }],
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
});
