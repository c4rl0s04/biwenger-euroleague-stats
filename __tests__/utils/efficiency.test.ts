import { describe, it, expect } from 'vitest';
import { calcEfficiency } from '@/lib/utils/efficiency';

describe('calcEfficiency', () => {
  it('returns 0 when both actual and ideal are 0', () => {
    expect(calcEfficiency(0, 0)).toBe(0);
  });

  it('returns 100 when ideal is 0 but actual is positive (defensive fallback)', () => {
    expect(calcEfficiency(5, 0)).toBe(100);
  });

  it('returns 0 when ideal is negative and actual is 0', () => {
    // ideal <= 0 and actual = 0 → return 0
    expect(calcEfficiency(0, -5)).toBe(0);
  });

  it('returns 100 when ideal is negative but actual is positive', () => {
    // ideal <= 0 and actual > 0 → return 100 (defensive fallback)
    expect(calcEfficiency(5, -5)).toBe(100);
  });

  it('calculates 100% when actual equals ideal', () => {
    expect(calcEfficiency(80, 80)).toBe(100);
  });

  it('calculates 50% when actual is half of ideal', () => {
    expect(calcEfficiency(40, 80)).toBe(50);
  });

  it('calculates 75% correctly', () => {
    expect(calcEfficiency(75, 100)).toBe(75);
  });

  it('rounds result to nearest integer', () => {
    // 1/3 * 100 = 33.33 → rounds to 33
    expect(calcEfficiency(1, 3)).toBe(33);
  });

  it('can exceed 100% if actual > ideal (data integrity signal)', () => {
    expect(calcEfficiency(90, 80)).toBeGreaterThan(100);
  });
});
