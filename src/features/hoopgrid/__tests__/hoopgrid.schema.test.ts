import { describe, expect, it } from 'vitest';
import {
  SubmitGuessInputSchema,
  SubmitBatchGuessesInputSchema,
  HoopgridDateQuerySchema,
  HoopgridValidationError,
  validateSubmitGuessInput,
  validateSubmitBatchGuessesInput,
  validateHoopgridDateQuery,
} from '../validation/hoopgrid.schema';

describe('hoopgrid validation schemas', () => {
  describe('SubmitGuessInputSchema', () => {
    it('accepts valid guess input', () => {
      const valid = {
        challengeId: 'ch-123',
        cellIndex: 4,
        playerId: 101,
        dryRun: false,
      };
      const result = validateSubmitGuessInput(valid);
      expect(result).toEqual(valid);
    });

    it('defaults dryRun to false when omitted', () => {
      const valid = {
        challengeId: 'ch-123',
        cellIndex: 0,
        playerId: 5,
      };
      const result = validateSubmitGuessInput(valid);
      expect(result.dryRun).toBe(false);
    });

    it('rejects invalid cellIndex (< 0 or > 8 or non-integer)', () => {
      expect(() =>
        validateSubmitGuessInput({ challengeId: 'ch-1', cellIndex: -1, playerId: 1 })
      ).toThrow(HoopgridValidationError);

      expect(() =>
        validateSubmitGuessInput({ challengeId: 'ch-1', cellIndex: 9, playerId: 1 })
      ).toThrow(HoopgridValidationError);

      expect(() =>
        validateSubmitGuessInput({ challengeId: 'ch-1', cellIndex: 2.5, playerId: 1 })
      ).toThrow(HoopgridValidationError);
    });

    it('rejects non-positive playerId', () => {
      expect(() =>
        validateSubmitGuessInput({ challengeId: 'ch-1', cellIndex: 0, playerId: 0 })
      ).toThrow(HoopgridValidationError);

      expect(() =>
        validateSubmitGuessInput({ challengeId: 'ch-1', cellIndex: 0, playerId: -10 })
      ).toThrow(HoopgridValidationError);
    });

    it('rejects empty challengeId', () => {
      expect(() =>
        validateSubmitGuessInput({ challengeId: '', cellIndex: 0, playerId: 1 })
      ).toThrow(HoopgridValidationError);
    });
  });

  describe('SubmitBatchGuessesInputSchema', () => {
    it('accepts valid batch input', () => {
      const valid = {
        challengeId: 'ch-123',
        action: 'submitBatch',
        guesses: {
          '0': { playerId: 10, isCorrect: true },
          '4': { playerId: 25, isCorrect: false },
        },
      };
      const result = validateSubmitBatchGuessesInput(valid);
      expect(result).toEqual(valid);
    });

    it('rejects invalid action', () => {
      expect(() =>
        validateSubmitBatchGuessesInput({
          challengeId: 'ch-1',
          action: 'otherAction',
          guesses: {},
        })
      ).toThrow(HoopgridValidationError);
    });

    it('rejects invalid guess structure within batch', () => {
      expect(() =>
        validateSubmitBatchGuessesInput({
          challengeId: 'ch-1',
          action: 'submitBatch',
          guesses: {
            '0': { playerId: -5, isCorrect: true },
          },
        })
      ).toThrow(HoopgridValidationError);
    });
  });

  describe('HoopgridDateQuerySchema', () => {
    it('accepts valid YYYY-MM-DD date format', () => {
      const result = validateHoopgridDateQuery({ date: '2026-05-18' });
      expect(result.date).toBe('2026-05-18');
    });

    it('accepts omitted date parameter', () => {
      const result = validateHoopgridDateQuery({});
      expect(result.date).toBeUndefined();
    });

    it('rejects malformed date formats', () => {
      expect(() => validateHoopgridDateQuery({ date: '18-05-2026' })).toThrow(
        HoopgridValidationError
      );
      expect(() => validateHoopgridDateQuery({ date: 'not-a-date' })).toThrow(
        HoopgridValidationError
      );
    });
  });
});
