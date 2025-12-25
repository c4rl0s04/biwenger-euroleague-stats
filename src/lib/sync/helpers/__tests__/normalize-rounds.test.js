import { describe, it, expect } from 'vitest';
import { normalizeRoundName, buildRoundNameMap, getCanonicalRoundId } from '../normalize-rounds.js';

describe('normalizeRoundName', () => {
  it('should remove "(aplazada)" suffix', () => {
    expect(normalizeRoundName('Jornada 5 (aplazada)')).toBe('Jornada 5');
  });

  it('should return name unchanged if no suffix', () => {
    expect(normalizeRoundName('Jornada 10')).toBe('Jornada 10');
  });

  it('should handle empty string', () => {
    expect(normalizeRoundName('')).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(normalizeRoundName(null)).toBe('');
    expect(normalizeRoundName(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(normalizeRoundName('  Jornada 3 (aplazada)  ')).toBe('Jornada 3');
  });
});

describe('buildRoundNameMap', () => {
  it('should map base names to lowest IDs', () => {
    const rounds = [
      { id: 5, name: 'Jornada 5' },
      { id: 25, name: 'Jornada 5 (aplazada)' },
      { id: 10, name: 'Jornada 10' },
    ];

    const map = buildRoundNameMap(rounds);

    expect(map['Jornada 5']).toBe(5);
    expect(map['Jornada 10']).toBe(10);
  });

  it('should keep lowest ID when multiple rounds have same base name', () => {
    const rounds = [
      { id: 25, name: 'Jornada 5 (aplazada)' },
      { id: 5, name: 'Jornada 5' },
      { id: 30, name: 'Jornada 5 (aplazada)' },
    ];

    const map = buildRoundNameMap(rounds);

    expect(map['Jornada 5']).toBe(5);
  });

  it('should handle empty array', () => {
    const map = buildRoundNameMap([]);
    expect(Object.keys(map).length).toBe(0);
  });
});

describe('getCanonicalRoundId', () => {
  it('should return canonical ID for postponed round', () => {
    const roundNameMap = { 'Jornada 5': 5 };
    const round = { id: 25, name: 'Jornada 5 (aplazada)' };

    expect(getCanonicalRoundId(round, roundNameMap)).toBe(5);
  });

  it('should return original ID for regular round', () => {
    const roundNameMap = { 'Jornada 10': 10 };
    const round = { id: 10, name: 'Jornada 10' };

    expect(getCanonicalRoundId(round, roundNameMap)).toBe(10);
  });

  it('should return original ID if not in map', () => {
    const roundNameMap = {};
    const round = { id: 99, name: 'Jornada 99' };

    expect(getCanonicalRoundId(round, roundNameMap)).toBe(99);
  });
});
