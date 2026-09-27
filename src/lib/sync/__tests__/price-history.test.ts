import { describe, expect, it } from 'vitest';
import {
  parsePlayerPriceHistory,
  priceHistoryBoundsKey,
  priceHistoryCheckpointKey,
  priceHistoryIsFresh,
  validatePriceHistoryBounds,
} from '../price-history';

const bounds = { startsAt: '2026-09-01', endsAt: '2027-06-30' };
const parse = (prices: unknown) =>
  parsePlayerPriceHistory({ data: { id: 7, prices } }, 7, bounds, '2026-09-27');

describe('authoritative price history validation', () => {
  it('uses provider dates, retains zeros and ignores other seasons and future dates', () => {
    expect(
      parse([
        [260925, 1850000],
        [250901, 99],
        [260901, '0'],
        [260928, 99],
        [270701, 99],
      ])
    ).toEqual([
      { date: '2026-09-01', price: 0 },
      { date: '2026-09-25', price: 1850000 },
    ]);
  });
  it('accepts late introductions and internal provider gaps without inventing prices', () => {
    expect(
      parse([
        [260918, 740000],
        [260920, 870000],
      ])
    ).toHaveLength(2);
    expect(parse([])).toEqual([]);
  });
  it.each(
    [
      null,
      {},
      [[260231, 10]],
      [[262509, 10]],
      [[260924]],
      [[260924, null]],
      [[260924, true]],
      [[260924, '']],
      [[260924, -1]],
      [[260924, 0.1]],
      [[260924, Infinity]],
      [[260924, 2147483648]],
      [[260924, 'bad']],
    ].map((prices) => ({ prices }))
  )('rejects malformed history before persistence: $prices', ({ prices }) => {
    expect(() => parse(prices)).toThrow();
  });
  it('rejects missing or mismatched identities', () => {
    for (const response of [null, {}, { data: { prices: [] } }, { data: { id: 8, prices: [] } }]) {
      expect(() => parsePlayerPriceHistory(response, 7, bounds, '2026-09-27')).toThrow();
    }
  });
  it('deduplicates equal values but refuses ambiguous duplicate dates', () => {
    expect(
      parse([
        [260924, 10],
        [260924, '10'],
      ])
    ).toHaveLength(1);
    expect(() =>
      parse([
        [260924, 10],
        [260924, 11],
      ])
    ).toThrow(/Conflicting/);
  });
  it('requires valid season boundaries and includes the end date', () => {
    expect(() => validatePriceHistoryBounds({ startsAt: '', endsAt: null })).toThrow();
    expect(() =>
      validatePriceHistoryBounds({ startsAt: '2026-09-01', endsAt: '2025-01-01' })
    ).toThrow();
    expect(
      parsePlayerPriceHistory(
        {
          data: {
            id: 7,
            prices: [
              [270630, 1],
              [270701, 2],
            ],
          },
        },
        7,
        bounds,
        '2027-07-02'
      )
    ).toEqual([{ date: '2027-06-30', price: 1 }]);
  });
  it('does not relabel a provider date across a UTC midnight', () => {
    const cutoff = new Date('2026-09-26T00:30:00+02:00').toISOString().slice(0, 10);
    expect(
      parsePlayerPriceHistory(
        {
          data: {
            id: 7,
            prices: [
              [260925, 1],
              [260926, 2],
            ],
          },
        },
        7,
        bounds,
        cutoff
      )
    ).toEqual([{ date: '2026-09-25', price: 1 }]);
  });
});

describe('season/player price-history checkpoints', () => {
  const now = new Date('2026-09-27T12:00:00Z');
  const key = priceHistoryBoundsKey(bounds);
  it('expires after 24 hours and refuses corrupt or future timestamps', () => {
    expect(priceHistoryIsFresh('2026-09-26T12:00:01Z', key, bounds, now)).toBe(true);
    for (const date of [null, 'bad', '2026-09-26T12:00:00Z', '2026-09-28T00:00:00Z']) {
      expect(priceHistoryIsFresh(date, key, bounds, now)).toBe(false);
    }
  });
  it('invalidates checkpoints after boundary changes and separates seasons and players', () => {
    expect(priceHistoryIsFresh(now.toISOString(), 'old-boundaries', bounds, now)).toBe(false);
    expect(priceHistoryCheckpointKey('2026-27', 7)).not.toBe(
      priceHistoryCheckpointKey('2025-26', 7)
    );
    expect(priceHistoryCheckpointKey('2026-27', 7)).not.toBe(
      priceHistoryCheckpointKey('2026-27', 8)
    );
  });
});
