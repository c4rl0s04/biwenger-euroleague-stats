export type RoundLifecycle = 'upcoming' | 'live' | 'finished';

/** Lifecycle belongs to the whole round, not the last unplayed match or a polling window. */
export function deriveRoundLifecycle(
  input: {
    firstMatchDate: string | Date | null;
    matchCount: number;
    finishedMatches: number;
    hasLiveMatch?: boolean;
  },
  now: Date
): RoundLifecycle {
  if (input.matchCount === 0) return 'upcoming';
  if (input.finishedMatches === input.matchCount) return 'finished';
  if (
    input.hasLiveMatch ||
    input.finishedMatches > 0 ||
    (input.firstMatchDate && new Date(input.firstMatchDate) <= now)
  )
    return 'live';
  return 'upcoming';
}
