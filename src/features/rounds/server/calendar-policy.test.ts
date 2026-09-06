import { describe, expect, it } from 'vitest';
import { deriveRoundCalendar, selectRoundId } from './calendar-policy';
import { mapCalendarMatch } from './mappers/calendar.mapper';
import type { CalendarMatch, RoundSelectionPolicy } from '../public';

const now = new Date('2026-01-10T12:00:00Z');
function match(
  id: number,
  roundId: number | null,
  date: string | null,
  status = 'scheduled'
): CalendarMatch {
  return { id, roundId, date, status, roundName: `Round ${roundId}` };
}
const past = '2026-01-09T12:00:00.000Z';
const future = '2026-01-11T12:00:00.000Z';

describe('round chronology compatibility', () => {
  it('returns explicit empty states', () => {
    expect(deriveRoundCalendar([], now)).toEqual({ currentRound: null, nextRound: null });
  });
  it('preserves preseason policy priorities, not round number ordering', () => {
    const state = deriveRoundCalendar([match(1, 9, future), match(2, 3, future)], now);
    expect(state.currentRound?.roundId).toBe(9);
    expect(state.nextRound?.roundId).toBe(3);
    expect(selectRoundId(state, 'active_or_last')).toBe(3);
    expect(selectRoundId(state, 'active_or_next')).toBe(3);
  });
  it('keeps unfinished past matches active, including postponed status', () => {
    const state = deriveRoundCalendar(
      [
        match(1, 2, past, 'postponed'),
        match(2, 8, past, 'finished'),
        match(3, 2, future),
        match(4, 9, future),
      ],
      now
    );
    expect(state.currentRound).toMatchObject({
      roundId: 2,
      status: 'live',
      totalMatches: 2,
      finishedMatches: 0,
      startDate: past,
      endDate: future,
    });
    expect(state.nextRound?.roundId).toBe(9);
    expect(selectRoundId(state, 'active_or_last')).toBe(2);
  });
  it('selects the last started match chronologically when all past matches finished', () => {
    const state = deriveRoundCalendar(
      [
        match(1, 9, past, 'finished'),
        match(2, 2, now.toISOString(), 'finished'),
        match(3, 4, future),
      ],
      now
    );
    expect(state.currentRound?.roundId).toBe(2);
    expect(selectRoundId(state, 'active_or_last')).toBe(2);
    expect(selectRoundId(state, 'active_or_next')).toBe(4);
  });
  it('preserves null groups, null dates and first encountered names', () => {
    const first = { ...match(1, null, null), roundName: null };
    const state = deriveRoundCalendar([first, match(2, null, null)], now);
    expect(state.currentRound).toMatchObject({
      roundId: null,
      roundName: null,
      startDate: null,
      endDate: null,
      totalMatches: 2,
      status: 'upcoming',
    });
    expect(state.nextRound).toBeNull();
  });
  it('preserves zero-ID truthiness branches and unknown-policy fallback', () => {
    const live = deriveRoundCalendar([match(1, 0, past)], now);
    expect(selectRoundId(live, 'active_or_next')).toBe(0);
    const finished = deriveRoundCalendar([match(1, 0, past, 'finished')], now);
    expect(selectRoundId(finished, 'active_or_next')).toBeNull();
    expect(selectRoundId(finished, 'active_or_last')).toBe(0);
    expect(selectRoundId(live, 'unknown' as RoundSelectionPolicy)).toBeNull();
  });
  it('maps only the calendar projection and serializes dates explicitly', () => {
    const row = {
      id: 1,
      roundId: 3,
      date: now,
      status: null,
      roundName: null,
      extra: 'not part of contract',
    };
    expect(mapCalendarMatch(row)).toEqual({
      id: 1,
      roundId: 3,
      date: now.toISOString(),
      status: null,
      roundName: null,
    });
    expect(mapCalendarMatch({ ...row, date: null }).date).toBeNull();
    const state = deriveRoundCalendar([mapCalendarMatch(row)], now);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
