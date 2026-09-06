import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: {}, pgClient: {} }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn(async () => '2025-2026') }));
vi.mock('./queries/calendar.query', () => ({ listCalendarRows: vi.fn() }));
import { listCalendarRows } from './queries/calendar.query';
import {
  getCurrentRoundState,
  getLastCompletedRound,
  resolveRoundIdByPolicy,
} from '@/lib/db/queries/competition/rounds';

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('keeps legacy Date objects, snake_case fields, nulls and the exact JSON envelope', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
  const date = new Date('2026-01-09T12:00:00Z');
  vi.mocked(listCalendarRows).mockResolvedValue([
    { id: 1, date, status: 'finished', roundId: 3, roundName: null },
  ]);
  const state = await getCurrentRoundState();
  expect(state.currentRound?.start_date).toBeInstanceOf(Date);
  expect(state.currentRound?.matches[0].date).toEqual(date);
  expect(JSON.parse(JSON.stringify(state))).toEqual({
    currentRound: {
      round_id: 3,
      round_name: null,
      start_date: date.toISOString(),
      end_date: date.toISOString(),
      total_matches: 1,
      finished_matches: 1,
      matches: [
        { id: 1, date: date.toISOString(), status: 'finished', round_id: 3, round_name: null },
      ],
      status_calc: 'finished',
    },
    nextRound: null,
  });
  expect(await resolveRoundIdByPolicy('active_or_last')).toBe(3);
  expect(await getLastCompletedRound()).toEqual(state.currentRound);
});

it('preserves an empty legacy response without extra fields', async () => {
  vi.mocked(listCalendarRows).mockResolvedValue([]);
  expect(await getCurrentRoundState()).toEqual({ currentRound: null, nextRound: null });
  expect(await getLastCompletedRound()).toBeNull();
});
