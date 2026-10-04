import 'server-only';

import { z } from 'zod';
import { CONFIG } from '@/lib/config';
import {
  getLiveBidMarket,
  getLivePlayerBidCount,
} from '../../../live/server/services/live-bidding.service';
import { marketCommandService } from '../../../commands/server/services/market-command.service';
import type { PersonalBidWorkspace } from '../../models/personal-bids';

export const PERSONAL_BIDS_POLICY = Object.freeze({
  access: 'configured-account-only',
  freshness: 'provider-no-store',
} as const);

export class PersonalBidError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = 'PersonalBidError';
  }
}

export function assertPersonalBidAccess(userId: string | undefined): asserts userId is string {
  if (!userId || !CONFIG.API.USER_ID || userId !== String(CONFIG.API.USER_ID)) {
    throw new PersonalBidError('forbidden', 'Esta página es privada.', 403);
  }
}

const bidSchema = z.object({
  playerId: z.number().int().positive(),
  amount: z.number().int().positive(),
  expectedListing: z.object({
    sellerId: z.number().int().positive().nullable(),
    price: z.number().int().min(0),
    closesAt: z.iso.datetime({ offset: true }),
  }),
});

export async function readPersonalBidWorkspace(userId: string): Promise<PersonalBidWorkspace> {
  assertPersonalBidAccess(userId);
  return { market: await getLiveBidMarket(userId) };
}

export async function readPersonalBidCount(userId: string, playerId: number) {
  assertPersonalBidAccess(userId);
  return getLivePlayerBidCount(userId, playerId);
}

export async function placePersonalBidNow(userId: string, raw: unknown) {
  assertPersonalBidAccess(userId);
  const parsed = bidSchema.safeParse(raw);
  if (!parsed.success) throw new PersonalBidError('invalid_input', 'Datos de puja no válidos.');
  return marketCommandService.placeBid(userId, parsed.data);
}
