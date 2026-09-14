import { describe, expect, it } from 'vitest';
import {
  canonicalRoundIds,
  isCompetitionRound,
  normalizeRoundName,
  relevantRounds,
  resolveRoundId,
  type BiwengerRound,
} from '../rounds';

describe('Rounds domain logic', () => {
  describe('normalizeRoundName', () => {
    it('normalizes postponed rounds by stripping (aplazada)', () => {
      expect(normalizeRoundName('Jornada 10 (aplazada)')).toBe('Jornada 10');
      expect(normalizeRoundName('Jornada 5 (APLAZADA)')).toBe('Jornada 5');
    });

    it('normalizes playoff, eliminatoria and final four naming', () => {
      expect(normalizeRoundName('Playoff Eliminatoria')).toBe('Eliminatoria');
      expect(normalizeRoundName('Final Four')).toBe('Final Four');
      expect(normalizeRoundName('Playoff Final Four')).toBe('Final Four');
    });

    it('handles empty or undefined inputs cleanly', () => {
      expect(normalizeRoundName(undefined)).toBe('');
      expect(normalizeRoundName('')).toBe('');
    });
  });

  describe('isCompetitionRound', () => {
    it('identifies official competition rounds', () => {
      expect(isCompetitionRound({ id: 1, name: 'Jornada 1' })).toBe(true);
      expect(isCompetitionRound({ id: 2, name: 'Playoff 1' })).toBe(true);
      expect(isCompetitionRound({ id: 3, name: 'Final Four' })).toBe(true);
      expect(isCompetitionRound({ id: 4, name: 'Eliminatoria' })).toBe(true);
      expect(isCompetitionRound({ id: 5, name: 'Play-In' })).toBe(true);
    });

    it('rejects non-competition or friendly rounds', () => {
      expect(isCompetitionRound({ id: 6, name: 'Preseason Friendly' })).toBe(false);
      expect(isCompetitionRound({ id: 7, name: 'Torneo Amistoso' })).toBe(false);
      expect(isCompetitionRound({ id: 8, name: '' })).toBe(false);
    });
  });

  describe('canonicalRoundIds & resolveRoundId', () => {
    it('maps postponed rounds to the canonical lowest id', () => {
      const rounds: BiwengerRound[] = [
        { id: 10, name: 'Jornada 10' },
        { id: 25, name: 'Jornada 10 (aplazada)' },
        { id: 11, name: 'Jornada 11' },
      ];

      const canonicalMap = canonicalRoundIds(rounds);
      expect(canonicalMap.get('Jornada 10')).toBe(10);
      expect(canonicalMap.get('Jornada 11')).toBe(11);

      expect(resolveRoundId({ id: 25, name: 'Jornada 10 (aplazada)' }, canonicalMap)).toBe(10);
      expect(resolveRoundId({ id: 10, name: 'Jornada 10' }, canonicalMap)).toBe(10);
      expect(resolveRoundId({ id: 11, name: 'Jornada 11' }, canonicalMap)).toBe(11);
    });

    it('preserves id for non-jornada rounds', () => {
      const canonicalMap = new Map<string, number>([['Final Four', 50]]);
      expect(resolveRoundId({ id: 99, name: 'Final Four' }, canonicalMap)).toBe(99);
    });
  });

  describe('relevantRounds', () => {
    it('sorts by id, filters non-competition rounds, and indexes multiple eliminatorias', () => {
      const rounds: BiwengerRound[] = [
        { id: 2, name: 'Jornada 2' },
        { id: 1, name: 'Jornada 1' },
        { id: 30, name: 'Eliminatoria' },
        { id: 99, name: 'Friendly Test' },
        { id: 31, name: 'Eliminatoria' },
      ];

      const result = relevantRounds(rounds);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ id: 1, name: 'Jornada 1' });
      expect(result[1]).toEqual({ id: 2, name: 'Jornada 2' });
      expect(result[2]).toEqual({ id: 30, name: 'Eliminatoria 1' });
      expect(result[3]).toEqual({ id: 31, name: 'Eliminatoria 2' });
    });
  });
});
