import type {
  CalendarMatch,
  CalendarRound,
  RoundCalendar,
  RoundCalendarState,
  RoundSelectionPolicy,
  SeasonPhase,
} from '../models/calendar';

/** Groups matches by round and computes comprehensive season round calendar state. */
export function deriveRoundCalendarState(matches: CalendarMatch[], now: Date): RoundCalendarState {
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
      round.status = round.finishedMatches >= round.totalMatches ? 'finished' : 'live';
    } else {
      round.status = 'upcoming';
    }
  }

  const liveRound = rounds.find((r) => r.status === 'live') ?? null;
  const finishedRounds = rounds.filter((r) => r.status === 'finished');
  const lastFinishedRound = finishedRounds.at(-1) ?? null;
  const upcomingRounds = rounds.filter((r) => r.status === 'upcoming');
  const nextUpcomingRound = upcomingRounds[0] ?? null;

  let seasonPhase: SeasonPhase = 'in_season';
  if (rounds.length === 0 || (finishedRounds.length === 0 && !liveRound)) {
    seasonPhase = 'preseason';
  } else if (upcomingRounds.length === 0 && !liveRound) {
    seasonPhase = 'postseason';
  }

  return {
    rounds,
    liveRound,
    lastFinishedRound,
    nextUpcomingRound,
    seasonPhase,
  };
}

/** Input retains database chronology (date ASC, id ASC), including null-date groups. */
export function deriveRoundCalendar(matches: CalendarMatch[], now: Date): RoundCalendar {
  const state = deriveRoundCalendarState(matches, now);
  const live = matches.find((m) => m.status !== 'finished' && m.date && new Date(m.date) <= now);
  const started = matches.filter((m) => m.date && new Date(m.date) <= now);
  const selected = live ?? started.at(-1);
  const currentRound = selected
    ? (state.rounds.find((r) => r.roundId === selected.roundId) ?? null)
    : (state.rounds[0] ?? null);
  const next = matches.find(
    (m) => m.date && new Date(m.date) > now && (!currentRound || m.roundId !== currentRound.roundId)
  );
  return {
    currentRound,
    nextRound: next ? (state.rounds.find((r) => r.roundId === next.roundId) ?? null) : null,
  };
}

export function selectRoundId(
  calendar: RoundCalendar | RoundCalendarState,
  policy: RoundSelectionPolicy
): number | null {
  const current =
    'currentRound' in calendar
      ? calendar.currentRound
      : (calendar.liveRound ?? calendar.lastFinishedRound);
  const next = 'nextRound' in calendar ? calendar.nextRound : calendar.nextUpcomingRound;

  if (policy === 'active_or_upcoming' || policy === 'active_or_next') {
    if (current?.status === 'live') return current.roundId;
    if (current?.status === 'upcoming') return current.roundId;
    if (next) return next.roundId;
    return current?.roundId || null;
  }

  if (policy === 'active_or_finished' || policy === 'active_or_last') {
    if (current?.status === 'live' || current?.status === 'finished') return current.roundId;
    return null;
  }

  return null;
}
