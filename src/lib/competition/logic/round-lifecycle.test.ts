import { expect, it } from 'vitest';
import { deriveRoundLifecycle } from './round-lifecycle';
const now = new Date('2026-10-22T00:00:00Z');
it.each([
  [{ firstMatchDate: '2026-10-21', matchCount: 10, finishedMatches: 1 }, 'live'],
  [{ firstMatchDate: '2026-10-21', matchCount: 10, finishedMatches: 0 }, 'live'],
  [{ firstMatchDate: null, matchCount: 10, finishedMatches: 1 }, 'live'],
  [{ firstMatchDate: null, matchCount: 10, finishedMatches: 0, hasLiveMatch: true }, 'live'],
  [{ firstMatchDate: '2026-10-23', matchCount: 10, finishedMatches: 0 }, 'upcoming'],
  [{ firstMatchDate: '2026-10-21', matchCount: 10, finishedMatches: 10 }, 'finished'],
  [{ firstMatchDate: null, matchCount: 0, finishedMatches: 0 }, 'upcoming'],
] as const)(
  'classifies the round independently of remaining scheduled matches',
  (state, expected) => {
    expect(deriveRoundLifecycle(state, now)).toBe(expected);
  }
);
