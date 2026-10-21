import 'server-only';
import {
  BiwengerAuthError,
  BiwengerRateLimitError,
  BiwengerNetworkError,
  BiwengerProviderError,
} from '@/features/provider/server';
import { CredentialError } from '@/lib/credentials/errors';
import { privateJsonResponse } from '@/lib/utils/response';
import { LineupValidationError } from '../validation/lineup-command.schema';

export class LineupOperationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: { invalidPlayerIds?: string[]; affectedSlotIndexes?: number[] }
  ) {
    super(message);
  }
}
export function lineupErrorResponse(error: unknown) {
  let failure: LineupOperationError;
  if (error instanceof LineupOperationError) failure = error;
  else if (error instanceof LineupValidationError)
    failure = new LineupOperationError('LINEUP_INVALID_REQUEST', error.message, 400);
  else if (
    (error instanceof BiwengerAuthError && error.status === 401) ||
    (error instanceof CredentialError && error.code === 'missing_credential')
  )
    failure = new LineupOperationError(
      'BIWENGER_RECONNECT_REQUIRED',
      'Renueva tu conexión con Biwenger para continuar.',
      409
    );
  else if (error instanceof BiwengerAuthError)
    failure = new LineupOperationError(
      'BIWENGER_ACCESS_DENIED',
      'Biwenger no permite esta operación con tu cuenta.',
      403
    );
  else if (error instanceof BiwengerRateLimitError)
    failure = new LineupOperationError(
      'BIWENGER_RATE_LIMITED',
      'Biwenger ha limitado las peticiones. Espera antes de volver a intentarlo.',
      429
    );
  else if (error instanceof BiwengerNetworkError)
    failure = new LineupOperationError(
      'BIWENGER_UNAVAILABLE',
      'No se pudo conectar con Biwenger. Conservamos tus cambios.',
      503
    );
  else if (error instanceof BiwengerProviderError)
    failure = new LineupOperationError(
      'BIWENGER_REJECTED',
      'Biwenger no ha aceptado la operación. Actualiza la plantilla y comprueba las reglas de la jornada.',
      error.status && error.status < 500 ? 422 : 502
    );
  else
    failure = new LineupOperationError(
      'LINEUP_UNEXPECTED_ERROR',
      'No se pudo completar la operación. Conservamos tus cambios.',
      500
    );
  const reference = crypto.randomUUID();
  console.warn('[Lineup operation failed]', {
    code: failure.code,
    status: failure.status,
    reference,
  });
  return privateJsonResponse(
    {
      success: false,
      error: failure.message,
      code: failure.code,
      ...(failure.status >= 500 ? { reference } : {}),
      ...(failure.details ? { details: failure.details } : {}),
    },
    failure.status
  );
}
