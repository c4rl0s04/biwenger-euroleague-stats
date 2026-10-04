import 'server-only';

import { privateJsonResponse } from '@/lib/utils/response';
import { LiveBidCountUnavailableError } from '../../live/server/services/live-bidding.service';
import {
  MarketBidConflictError,
  MarketBidOutcomeUnknownError,
} from '../../commands/server/services/market-command.service';
import { MarketCommandValidationError } from '../../commands/validation/market-command.schema';
import { PersonalBidError } from './services/personal-bids.service';

export async function readPersonalJson(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > 4096)
    throw new PersonalBidError('too_large', 'Solicitud demasiado grande.', 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new PersonalBidError('invalid_json', 'Solicitud inválida.');
  }
}

export function personalBidErrorResponse(error: unknown) {
  if (error instanceof PersonalBidError)
    return privateJsonResponse({ message: error.message, code: error.code }, error.status);
  if (error instanceof MarketBidConflictError)
    return privateJsonResponse(
      { message: 'El anuncio o tu puja han cambiado. Actualiza el mercado.', code: error.code },
      409
    );
  if (error instanceof MarketBidOutcomeUnknownError)
    return privateJsonResponse({ message: error.message, code: 'outcome_unknown' }, 503);
  if (error instanceof MarketCommandValidationError)
    return privateJsonResponse({ message: error.message, code: 'invalid_input' }, 400);
  if (error instanceof LiveBidCountUnavailableError)
    return privateJsonResponse({ message: error.message, code: 'count_unavailable' }, 409);
  console.error('Personal bid request failed', error instanceof Error ? error.name : 'unknown');
  return privateJsonResponse({ message: 'No se pudo completar la operación.' }, 500);
}
