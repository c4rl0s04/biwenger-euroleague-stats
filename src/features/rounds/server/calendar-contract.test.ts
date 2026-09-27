import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: {}, pgClient: {} }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn(async () => '2025-2026') }));
vi.mock('./queries/calendar.query', () => ({ listCalendarRows: vi.fn() }));
import { listCalendarRows } from './queries/calendar.query';
import {
  getRoundCalendar as getCurrentRoundState,
  getLastCompletedCalendarRound as getLastCompletedRound,
  resolveRoundIdByPolicy,
} from '@/features/rounds/server';

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('keeps calendar nulls, chronology and serializable fields at the feature contract', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
  const date = new Date('2026-01-09T12:00:00Z');
  vi.mocked(listCalendarRows).mockResolvedValue([
    { id: 1, date, status: 'finished', roundId: 3, roundName: null },
  ]);
  const state = await getCurrentRoundState();
  expect(state.currentRound?.startDate).toBe(date.toISOString());
  expect(state.currentRound?.matches[0].date).toEqual(date.toISOString());
  expect(JSON.parse(JSON.stringify(state))).toEqual({
    currentRound: {
      roundId: 3,
      roundName: null,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
      totalMatches: 1,
      finishedMatches: 1,
      matches: [
        { id: 1, date: date.toISOString(), status: 'finished', roundId: 3, roundName: null },
      ],
      status: 'finished',
    },
    nextRound: null,
  });
  expect(await resolveRoundIdByPolicy('active_or_last')).toBe(3);
  expect(await getLastCompletedRound()).toEqual(state.currentRound);
});

it('preserves an empty calendar response without extra fields', async () => {
  vi.mocked(listCalendarRows).mockResolvedValue([]);
  expect(await getCurrentRoundState()).toEqual({ currentRound: null, nextRound: null });
  expect(await getLastCompletedRound()).toBeNull();
});
