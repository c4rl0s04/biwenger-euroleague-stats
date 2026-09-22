import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/standings/server', () => ({
  getLandingStandings: vi.fn(),
  getRequestStandings: vi.fn(),
}));
vi.mock('@/features/rounds/server', () => ({ getRoundCalendar: vi.fn() }));
vi.mock('@/features/managers/server', () => ({ getManagerPersonalizedAlerts: vi.fn() }));
vi.mock('../queries/home-feed.query', () => ({
  queryHomeActivityRows: vi.fn(),
  queryHomeRoundHighlightPlayers: vi.fn(),
}));
vi.mock('../queries/home-summary.query', () => ({ queryHomeSeasonMetadata: vi.fn() }));
import { createHomeFeedService } from './feed.service';
import { createHomeSummaryService } from './summary.service';
import { createLandingService } from './landing.service';
import { decodeHomeFeedCursor } from '../validation/cursor';
import { normalizeActivityRow } from '../mappers/activity.mapper';
import { HOME_READ_POLICY } from './read-policy';
import type { CalendarRound } from '@/features/rounds/public';

const round = (roundName: string): CalendarRound => ({
  roundId: 7,
  roundName,
  startDate: null,
  endDate: null,
  totalMatches: 0,
  finishedMatches: 0,
  matches: [],
  status: 'upcoming',
});

describe('Home compatibility edge cases', () => {
  it('advances the raw-row cursor even when the boundary highlight is omitted', async () => {
    const rows = vi.fn().mockResolvedValue(
      Array.from({ length: 16 }, (_, i) => ({
        id: `round_highlight:${i + 1}`,
        type: 'round_highlight',
        occurred_at: '2026-10-01T00:00:00Z',
        payload: { roundId: i + 1 },
      }))
    );
    const highlights = vi.fn().mockResolvedValue([]);
    const read = createHomeFeedService({ rows, highlights });
    const page = await read();
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(true);
    expect(decodeHomeFeedCursor(page.nextCursor!)).toEqual({
      occurredAt: '2026-10-01T00:00:00.000Z',
      id: 'round_highlight:15',
      filter: 'all',
    });
    expect(highlights).toHaveBeenCalledWith(Array.from({ length: 15 }, (_, i) => i + 1));
    await read();
    expect(rows).toHaveBeenCalledTimes(2);
  });
  it('returns an empty successful page and rejects invalid cursors before querying', async () => {
    const rows = vi.fn().mockResolvedValue([]);
    const read = createHomeFeedService({ rows, highlights: vi.fn().mockResolvedValue([]) });
    expect(await read()).toEqual({ items: [], hasMore: false, nextCursor: null });
    await expect(read({ cursor: 'bad' })).rejects.toThrow('Cursor de actividad no válido');
    expect(rows).toHaveBeenCalledTimes(1);
    rows.mockRejectedValueOnce(new Error('read failed'));
    await expect(read()).rejects.toThrow('read failed');
  });
  it('allowlists mapper output and preserves numeric/null/text fallbacks', () => {
    const mapped = normalizeActivityRow({
      id: 'transfer_day:1',
      type: 'transfer_day',
      occurred_at: new Date('2026-10-01'),
      payload: {
        secret: 'synthetic-not-output',
        transfers: [
          {
            occurredAt: 'bad-date',
            playerName: '',
            buyerName: null,
            amount: null,
            marketValue: 'invalid',
          },
        ],
      },
    });
    expect(mapped).toMatchObject({
      type: 'transfer_day',
      occurredAt: '2026-10-01T00:00:00.000Z',
      transfers: [
        {
          player: { name: 'Jugador' },
          buyer: { name: 'Mercado', isMarket: true },
          amount: 0,
          marketValue: null,
          occurredAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    });
    expect(JSON.stringify(mapped)).not.toContain('synthetic-not-output');
    expect(JSON.parse(JSON.stringify(mapped))).toEqual(mapped);
  });
  it('uses trusted user identity and isolates alert failure while retaining next-round fallback', async () => {
    const deps = {
      season: vi
        .fn()
        .mockResolvedValue({ id: 's', name: 'Season', status: 'frozen', completedRounds: 2 }),
      standings: vi.fn().mockResolvedValue([]),
      rounds: vi.fn().mockResolvedValue({ currentRound: null, nextRound: round('Jornada 7') }),
      alerts: vi.fn().mockRejectedValue(new Error('unavailable')),
    };
    const read = createHomeSummaryService(deps);
    expect(await read('007')).toMatchObject({
      phase: 'finished',
      user: { id: '007', name: 'Manager', position: null },
      round: { id: 7, name: 'Jornada 7' },
      alerts: [],
    });
    expect(deps.alerts).toHaveBeenCalledWith('007', 3);
    deps.season.mockRejectedValue(new Error('season failed'));
    await expect(read('8')).rejects.toThrow('season failed');
  });
  it.each([
    ['Jornada 4', 35],
    ['Final 40', 0],
    ['Sin número', 0],
    ['Jornada 0', 0],
  ])('preserves landing calculation for %s', async (name, expected) => {
    const order: string[] = [];
    const read = createLandingService({
      standings: vi.fn(async () => {
        order.push('standings');
        return [];
      }),
      rounds: vi.fn(async () => {
        order.push('rounds');
        return { currentRound: round(name), nextRound: null };
      }),
      seasonName: () => 'Configured season',
    });
    expect(await read()).toEqual({
      seasonName: 'Configured season',
      userCount: 0,
      currentRound: name,
      weeksToPlayoffs: expected,
      playoffStartRound: 39,
    });
    expect(order).toEqual(['standings', 'rounds']);
  });
  it('does not use next-round data for landing statistics or publicly cache the activity feed', async () => {
    const read = createLandingService({
      standings: vi.fn().mockResolvedValue([{}]),
      rounds: vi.fn().mockResolvedValue({ currentRound: null, nextRound: round('Jornada 4') }),
      seasonName: () => 'Season',
    });
    expect(await read()).toMatchObject({
      userCount: 1,
      currentRound: 'Pre-Season',
      weeksToPlayoffs: 0,
    });
    expect(HOME_READ_POLICY.activity.httpCache).toBe('private, no-store');
    expect(HOME_READ_POLICY.landing.httpCache).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
  });
});
