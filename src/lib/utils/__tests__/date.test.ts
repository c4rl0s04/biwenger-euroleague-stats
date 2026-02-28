import { describe, it, expect } from 'vitest';
import { getCorrectedMatchDate, formatMatchTime, formatMatchDate } from '@/lib/utils/date';

describe('getCorrectedMatchDate', () => {
  it('returns null for null input', () => {
    expect(getCorrectedMatchDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getCorrectedMatchDate(undefined)).toBeNull();
  });

  it('returns a Date object from a valid date string', () => {
    const result = getCorrectedMatchDate('2025-03-01T18:00:00');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result!.getTime())).toBe(false);
  });

  it('returns a Date object from a Date input', () => {
    const input = new Date('2025-03-01T18:00:00Z');
    const result = getCorrectedMatchDate(input);
    expect(result).toBeInstanceOf(Date);
  });
});

describe('formatMatchTime', () => {
  it('returns empty string for null', () => {
    expect(formatMatchTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatMatchTime(undefined)).toBe('');
  });

  it('returns a time string HH:MM format from ISO date string', () => {
    const result = formatMatchTime('2025-03-01T18:00:00Z');
    // Should be a time string like "19:00" (CET = UTC+1) or similar
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatMatchDate', () => {
  it('returns empty string for null', () => {
    expect(formatMatchDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatMatchDate(undefined)).toBe('');
  });

  it('returns a non-empty string for valid date', () => {
    const result = formatMatchDate('2025-03-01T18:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
