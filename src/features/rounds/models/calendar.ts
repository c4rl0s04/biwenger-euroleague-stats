export type RoundSelectionPolicy = 'active_or_next' | 'active_or_last';
export type CalendarStatus = 'upcoming' | 'live' | 'finished';

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

export interface RoundCalendar {
  currentRound: CalendarRound | null;
  nextRound: CalendarRound | null;
}
