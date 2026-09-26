import { z } from 'zod';
import type { LineupCommandInput } from '../models/lineup';

export const safeIdentifierSchema = z.union([
  z.string().min(1, 'El identificador no puede estar vacío'),
  z.number().finite('El identificador numérico debe ser finito'),
]);

export const lineupCommandSchema = z
  .object({
    type: z.string().min(1).optional(),
    playersID: z
      .array(safeIdentifierSchema)
      .min(1, 'Se requiere al menos un jugador en la alineación'),
    reservesID: z.array(safeIdentifierSchema).optional().default([]),
    captain: safeIdentifierSchema.nullable().optional(),
    striker: safeIdentifierSchema.nullable().optional(),
    coach: safeIdentifierSchema.nullable().optional(),
  })
  .passthrough();

export const lineupRequestBodySchema = z.object({
  lineup: lineupCommandSchema,
});

export class LineupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LineupValidationError';
  }
}

/**
 * Validates a lineup mutation payload object (e.g. `{ type, playersID, reservesID, captain }`).
 */
export function validateLineupCommand(input: unknown): LineupCommandInput {
  if (!input || typeof input !== 'object') {
    throw new LineupValidationError('Se requiere un objeto de alineación válido');
  }

  const result = lineupCommandSchema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0]?.message || 'Alineación no válida';
    throw new LineupValidationError(firstIssue);
  }

  return result.data as LineupCommandInput;
}

/**
 * Validates the full HTTP POST request body `{ lineup: ... }`.
 */
export function validateLineupRequestBody(body: unknown): LineupCommandInput {
  if (!body || typeof body !== 'object') {
    throw new LineupValidationError('Se requiere el objeto "lineup"');
  }

  const result = lineupRequestBodySchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0]?.message || 'Se requiere el objeto "lineup"';
    throw new LineupValidationError(firstIssue);
  }

  return result.data.lineup as LineupCommandInput;
}
