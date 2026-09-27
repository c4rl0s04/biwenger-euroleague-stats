import { z } from 'zod';

export class HoopgridValidationError extends Error {
  public readonly errors: Array<{ field?: string; message: string }>;

  constructor(message: string, errors: Array<{ field?: string; message: string }> = []) {
    super(message);
    this.name = 'HoopgridValidationError';
    this.errors = errors;
  }
}

export const HoopgridDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' })
    .optional(),
});

export const SubmitGuessInputSchema = z.object({
  challengeId: z
    .string({ message: 'challengeId is required' })
    .min(1, { message: 'challengeId is required' }),
  cellIndex: z
    .number({ message: 'cellIndex must be a number' })
    .int({ message: 'cellIndex must be an integer' })
    .min(0, { message: 'cellIndex must be between 0 and 8' })
    .max(8, { message: 'cellIndex must be between 0 and 8' }),
  playerId: z
    .number({ message: 'playerId must be a number' })
    .int({ message: 'playerId must be an integer' })
    .positive({ message: 'playerId must be positive' }),
  dryRun: z.boolean().optional().default(false),
});

export const SubmitBatchGuessesInputSchema = z.object({
  challengeId: z
    .string({ message: 'challengeId is required' })
    .min(1, { message: 'challengeId is required' }),
  action: z.literal('submitBatch'),
  guesses: z.record(
    z.string(),
    z.object({
      playerId: z.number().int().positive(),
      isCorrect: z.boolean(),
    })
  ),
});

export function validateSubmitGuessInput(data: unknown) {
  const result = SubmitGuessInputSchema.safeParse(data);
  if (!result.success) {
    throw new HoopgridValidationError(
      'Invalid guess input',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }
  return result.data;
}

export function validateSubmitBatchGuessesInput(data: unknown) {
  const result = SubmitBatchGuessesInputSchema.safeParse(data);
  if (!result.success) {
    throw new HoopgridValidationError(
      'Invalid batch guesses input',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }
  return result.data;
}

export function validateHoopgridDateQuery(data: unknown) {
  const result = HoopgridDateQuerySchema.safeParse(data);
  if (!result.success) {
    throw new HoopgridValidationError(
      'Invalid date parameter',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }
  return result.data;
}
