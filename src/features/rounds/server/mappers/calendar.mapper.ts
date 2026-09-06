import type { CalendarMatch } from '../../models/calendar';
import type { CalendarRow } from '../queries/calendar.query';

export function mapCalendarMatch(row: CalendarRow): CalendarMatch {
  return {
    id: row.id,
    date: row.date?.toJSON() ?? null,
    status: row.status,
    roundId: row.roundId,
    roundName: row.roundName,
  };
}
