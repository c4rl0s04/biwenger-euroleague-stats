import { describe, expect, it } from 'vitest';

import { formatCompactMoney, formatExactMoney, formatExactPoints } from './formatters';

describe('mobile home number formatters', () => {
  it('formats points as an exact spanish integer instead of an ambiguous compact value', () => {
    expect(formatExactPoints(8256)).toBe('8.256 pts');
  });

  it('uses explicit compact money units', () => {
    expect(formatCompactMoney(94_400_000)).toBe('94,4 M€');
    expect(formatCompactMoney(550_000)).toBe('550 mil €');
  });

  it('formats transfer prices exactly', () => {
    expect(formatExactMoney(275_000)).toBe('275.000 €');
  });
});
