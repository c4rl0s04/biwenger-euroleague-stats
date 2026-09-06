import type {
  CalendarMatch,
  CalendarRound,
  RoundCalendar,
  RoundSelectionPolicy,
} from '../models/calendar';

/** Input retains database chronology (date ASC, id ASC), including null-date groups. */
export function deriveRoundCalendar(matches: CalendarMatch[], now: Date): RoundCalendar {
  const groups = new Map<number | null, CalendarRound>();
  for (const match of matches) {
    let round = groups.get(match.roundId);
    if (!round) {
      round = {
        roundId: match.roundId,
        roundName: match.roundName,
        startDate: match.date,
        endDate: match.date,
        totalMatches: 0,
        finishedMatches: 0,
        matches: [],
        status: 'upcoming',
      };
      groups.set(match.roundId, round);
    }
    round.totalMatches++;
    if (match.status === 'finished') round.finishedMatches++;
    round.matches.push(match);
    if (match.date && (!round.startDate || new Date(match.date) < new Date(round.startDate)))
      round.startDate = match.date;
    if (match.date && (!round.endDate || new Date(match.date) > new Date(round.endDate)))
      round.endDate = match.date;
  }
  const rounds = Array.from(groups.values());
  for (const round of rounds) {
    if (round.startDate && now >= new Date(round.startDate)) {
      round.status = round.finishedMatches < round.totalMatches ? 'live' : 'finished';
    }
  }
  const live = matches.find((m) => m.status !== 'finished' && m.date && new Date(m.date) <= now);
  const started = matches.filter((m) => m.date && new Date(m.date) <= now);
  const selected = live ?? started.at(-1);
  const currentRound = selected ? (groups.get(selected.roundId) ?? null) : (rounds[0] ?? null);
  const next = matches.find(
    (m) => m.date && new Date(m.date) > now && (!currentRound || m.roundId !== currentRound.roundId)
  );
  return { currentRound, nextRound: next ? (groups.get(next.roundId) ?? null) : null };
}

export function selectRoundId(
  { currentRound, nextRound }: RoundCalendar,
  policy: RoundSelectionPolicy
): number | null {
  // Preserve legacy zero-ID truthiness and preseason priorities deliberately.
  if (policy === 'active_or_next') {
    if (currentRound?.status === 'live') return currentRound.roundId;
    if (nextRound) return nextRound.roundId;
    return currentRound?.roundId || null;
  }
  if (policy === 'active_or_last') {
    if (currentRound?.status === 'live' || currentRound?.status === 'finished')
      return currentRound.roundId;
    return nextRound?.roundId || null;
  }
  return null;
}
