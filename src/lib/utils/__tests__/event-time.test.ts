import { describe, expect, it } from 'vitest';
import { formatEventInstant, SERVER_EVENT_TIME_ZONE } from '../event-time';

describe('formatEventInstant', () => {
  it.each([
    ['2026-11-19T23:30:00Z', '20 nov, 00:30', '19 nov, 18:30'],
    ['2026-03-29T00:30:00Z', '29 mar, 01:30', '28 mar, 20:30'],
    ['2026-03-29T01:30:00Z', '29 mar, 03:30', '28 mar, 21:30'],
  ])('renders %s on the viewer’s local date across midnight and DST', (value, madrid, newYork) => {
    expect(formatEventInstant(value, SERVER_EVENT_TIME_ZONE, 'dateTime')).toBe(madrid);
    expect(formatEventInstant(value, 'America/New_York', 'dateTime')).toBe(newYork);
  });

  it.each(['2026-11-19', '2026-11-19T23:30:00', 'invalid', null])(
    'does not treat %s as an event instant',
    (value) => {
      expect(formatEventInstant(value, 'America/New_York', 'time')).toBe('');
    }
  );
});
