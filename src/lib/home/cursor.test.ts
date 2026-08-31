import { describe, expect, it } from 'vitest';

import { decodeHomeFeedCursor, encodeHomeFeedCursor } from './cursor';

describe('home activity cursor', () => {
  it('round-trips the stable event boundary', () => {
    const cursor = encodeHomeFeedCursor({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'transfer_day:2026-10-02',
      filter: 'transfers',
    });

    expect(decodeHomeFeedCursor(cursor)).toEqual({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'transfer_day:2026-10-02',
      filter: 'transfers',
    });
  });

  it('rejects a cursor when it belongs to another activity filter', () => {
    const cursor = encodeHomeFeedCursor({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'transfer_day:2026-10-02',
      filter: 'transfers',
    });

    expect(() => decodeHomeFeedCursor(cursor, 'rounds')).toThrow('Cursor de actividad no válido');
  });

  it('isolates prediction pages from the other activity filters', () => {
    const cursor = encodeHomeFeedCursor({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'prediction_round:Jornada_4',
      filter: 'predictions',
    });

    expect(decodeHomeFeedCursor(cursor, 'predictions').filter).toBe('predictions');
    expect(() => decodeHomeFeedCursor(cursor, 'rounds')).toThrow('Cursor de actividad no válido');
  });

  it('isolates MVP and ideal-lineup pages from round pages', () => {
    const cursor = encodeHomeFeedCursor({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'round_highlight:4',
      filter: 'highlights',
    });

    expect(decodeHomeFeedCursor(cursor, 'highlights').filter).toBe('highlights');
    expect(() => decodeHomeFeedCursor(cursor, 'rounds')).toThrow('Cursor de actividad no válido');
  });

  it.each(['', 'not-base64', 'e30', 'eyJvY2N1cnJlZEF0IjoieCIsImlkIjoiMSJ9'])(
    'rejects an invalid cursor: %s',
    (cursor) => {
      expect(() => decodeHomeFeedCursor(cursor)).toThrow('Cursor de actividad no válido');
    }
  );
});
