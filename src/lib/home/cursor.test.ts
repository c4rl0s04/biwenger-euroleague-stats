import { describe, expect, it } from 'vitest';

import { decodeHomeFeedCursor, encodeHomeFeedCursor } from './cursor';

describe('home activity cursor', () => {
  it('round-trips the stable event boundary', () => {
    const cursor = encodeHomeFeedCursor({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'transfer:1042',
    });

    expect(decodeHomeFeedCursor(cursor)).toEqual({
      occurredAt: '2026-10-02T20:30:00.000Z',
      id: 'transfer:1042',
    });
  });

  it.each(['', 'not-base64', 'e30', 'eyJvY2N1cnJlZEF0IjoieCIsImlkIjoiMSJ9']) (
    'rejects an invalid cursor: %s',
    (cursor) => {
      expect(() => decodeHomeFeedCursor(cursor)).toThrow('Cursor de actividad no válido');
    }
  );
});

