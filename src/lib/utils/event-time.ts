export const SERVER_EVENT_TIME_ZONE = 'Europe/Madrid';

const time = { hour: '2-digit', minute: '2-digit' } as const;
const date = { day: 'numeric', month: 'short' } as const;
const formats = {
  time,
  day: { weekday: 'long', day: 'numeric', month: 'long' },
  shortDay: { weekday: 'short', ...date },
  date,
  dateTime: { ...date, ...time },
  fullDateTime: { weekday: 'long', day: 'numeric', month: 'long', ...time },
  weekdayDay: { weekday: 'short', day: 'numeric' },
  longDeadline: { dateStyle: 'long', timeStyle: 'short' },
  deadline: { dateStyle: 'short', timeStyle: 'short' },
  absolute: { ...date, year: 'numeric', ...time, timeZoneName: 'short' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type EventTimeFormat = keyof typeof formats;

export function formatEventInstant(
  value: string | null | undefined,
  timeZone: string,
  format: EventTimeFormat
): string {
  if (!value || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return '';
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return '';

  return instant.toLocaleString('es-ES', { ...formats[format], timeZone });
}
