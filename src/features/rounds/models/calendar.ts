export type RoundSelectionPolicy =
  | 'active_or_upcoming'
  | 'active_or_finished'
  | 'active_or_next'
  | 'active_or_last';

export type CalendarStatus = 'upcoming' | 'live' | 'finished';

export type SeasonPhase = 'preseason' | 'in_season' | 'postseason';

export interface CalendarMatch {
  id: number;
  date: string | null;
  status: string | null;
  roundId: number | null;
  roundName: string | null;
}

export interface CalendarRound {
  roundId: number | null;
  roundName: string | null;
  startDate: string | null;
  endDate: string | null;
  totalMatches: number;
  finishedMatches: number;
  matches: CalendarMatch[];
  status: CalendarStatus;
}

export interface RoundCalendarState {
  rounds: CalendarRound[];
  liveRound: CalendarRound | null;
  lastFinishedRound: CalendarRound | null;
  nextUpcomingRound: CalendarRound | null;
  seasonPhase: SeasonPhase;
}

export interface RoundCalendar {
  currentRound: CalendarRound | null;
  nextRound: CalendarRound | null;
}
