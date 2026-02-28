import { describe, it, expect } from 'vitest';
import { calculateStats } from '@/lib/logic/performance';

const makeRound = (actual: number, ideal: number, efficiency: number) => ({
  actual_points: actual,
  ideal_points: ideal,
  efficiency,
});

describe('calculateStats', () => {
  it('returns null for null input', () => {
    expect(calculateStats(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(calculateStats(undefined)).toBeNull();
  });

  it('returns null for an empty array', () => {
    expect(calculateStats([])).toBeNull();
  });

  it('calculates correct roundsPlayed', () => {
    const history = [makeRound(80, 100, 80), makeRound(60, 80, 75)];
    const result = calculateStats(history);
    expect(result?.roundsPlayed).toBe(2);
  });

  it('calculates correct totalActual', () => {
    const history = [makeRound(80, 100, 80), makeRound(60, 80, 75)];
    const result = calculateStats(history);
    expect(result?.totalActual).toBe(140);
  });

  it('calculates correct totalIdeal', () => {
    const history = [makeRound(80, 100, 80), makeRound(60, 80, 75)];
    const result = calculateStats(history);
    expect(result?.totalIdeal).toBe(180);
  });

  it('calculates correct totalLost (ideal - actual)', () => {
    const history = [makeRound(80, 100, 80), makeRound(60, 80, 75)];
    const result = calculateStats(history);
    expect(result?.totalLost).toBe(40);
  });

  it('calculates correct avgEfficiency as a string with 1 decimal', () => {
    const history = [makeRound(80, 100, 80), makeRound(60, 80, 60)];
    const result = calculateStats(history);
    expect(result?.avgEfficiency).toBe('70.0');
  });

  it('identifies bestRound by highest actual_points', () => {
    const r1 = makeRound(90, 100, 90);
    const r2 = makeRound(60, 80, 75);
    const result = calculateStats([r1, r2]);
    expect(result?.bestRound).toEqual(r1);
  });

  it('identifies worstRound by lowest actual_points', () => {
    const r1 = makeRound(90, 100, 90);
    const r2 = makeRound(60, 80, 75);
    const result = calculateStats([r1, r2]);
    expect(result?.worstRound).toEqual(r2);
  });

  it('identifies bestEffRound by highest efficiency', () => {
    const r1 = makeRound(80, 100, 80);
    const r2 = makeRound(60, 70, 86);
    const result = calculateStats([r1, r2]);
    expect(result?.bestEffRound).toEqual(r2);
  });

  it('identifies worstEffRound by lowest efficiency', () => {
    const r1 = makeRound(80, 100, 80);
    const r2 = makeRound(60, 70, 50);
    const result = calculateStats([r1, r2]);
    expect(result?.worstEffRound).toEqual(r2);
  });

  it('handles single round correctly', () => {
    const r = makeRound(75, 100, 75);
    const result = calculateStats([r]);
    expect(result?.roundsPlayed).toBe(1);
    expect(result?.totalActual).toBe(75);
    expect(result?.bestRound).toEqual(r);
    expect(result?.worstRound).toEqual(r);
  });
});
