import { describe, expect, it } from 'vitest';

import {
  formatCompactMoney,
  formatExactMoney,
  formatExactPoints,
  formatSpanishInteger,
  formatSignedMoney,
  formatSignedPercentage,
} from './formatters';

describe('mobile home number formatters', () => {
  it('formats points as an exact spanish integer instead of an ambiguous compact value', () => {
    expect(formatExactPoints(8256)).toBe('8.256 pts');
    expect(formatSpanishInteger(8256)).toBe('8.256');
  });

  it('uses explicit compact money units', () => {
    expect(formatCompactMoney(94_400_000)).toBe('94,4 M€');
    expect(formatCompactMoney(550_000)).toBe('550 mil €');
  });

  it('formats transfer prices exactly', () => {
    expect(formatExactMoney(275_000)).toBe('275.000 €');
  });

  it('formats signed transfer differences without ambiguous abbreviations', () => {
    expect(formatSignedMoney(275_000)).toBe('+275.000 €');
    expect(formatSignedMoney(-275_000)).toBe('−275.000 €');
    expect(formatSignedPercentage(12.34)).toBe('+12,3 %');
    expect(formatSignedPercentage(-12.34)).toBe('−12,3 %');
    expect(formatSignedPercentage(0)).toBe('0 %');
  });
});
