import 'server-only';

import { randomUUID } from 'node:crypto';
import { Client, Receiver } from '@upstash/qstash';
import { z } from 'zod';
import { CONFIG } from '@/lib/config';
import {
  getLiveBidMarket,
  getLivePlayerBidCount,
} from '../../../live/server/services/live-bidding.service';
import {
  marketCommandService,
  MarketBidConflictError,
  MarketBidOutcomeUnknownError,
} from '../../../commands/server/services/market-command.service';
import { LiveBidCountUnavailableError } from '../../../live/server/services/live-bidding.service';
import type { LiveMarketListing } from '../../../live/models/live-bidding';
import type { PersonalBidWorkspace } from '../../models/personal-bids';
import {
  attachQueueMessage,
  cancelPersonalBidRule,
  claimPersonalBidRule,
  failScheduling,
  finishPersonalBidRule,
  insertPersonalBidRule,
  listPersonalBidRules,
} from '../repositories/personal-bid.repository';

export const PERSONAL_BIDS_POLICY = Object.freeze({
  access: 'configured-account-only',
  freshness: 'provider-no-store',
  scheduling: 'one-shot-signed-qstash',
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

const expectedListingSchema = z.object({
  sellerId: z.number().int().positive().nullable(),
  price: z.number().int().min(0),
  closesAt: z.iso.datetime({ offset: true }),
});
const bidSchema = z.object({
  playerId: z.number().int().positive(),
  amount: z.number().int().positive(),
  expectedListing: expectedListingSchema,
});
const ruleSchema = z.object({
  playerId: z.number().int().positive(),
  expectedListing: expectedListingSchema,
  amountWithoutBids: z.number().int().positive(),
  amountWithBids: z.number().int().positive(),
  minutesBeforeClose: z.number().int().min(3).max(60),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new PersonalBidError('invalid_input', 'Datos de puja no válidos.');
  return result.data;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && isUniqueViolation(error.cause);
}

function requireMatchingListing(
  listings: LiveMarketListing[],
  playerId: number,
  expected: z.infer<typeof expectedListingSchema>
) {
  const matches = listings.filter((item) => item.playerId === playerId);
  const listing = matches.length === 1 ? matches[0] : null;
  if (
    !listing ||
    listing.sellerId !== expected.sellerId ||
    listing.price !== expected.price ||
    listing.closesAt !== expected.closesAt
  ) {
    throw new PersonalBidError(
      'listing_changed',
      'El anuncio ha cambiado. Actualiza el mercado.',
      409
    );
  }
  if (listing.isOwnListing || listing.ownWaitingOffers.length) {
    throw new PersonalBidError('own_offer', 'Ya tienes una puja o el jugador es tuyo.', 409);
  }
  return listing;
}

export async function readPersonalBidWorkspace(userId: string): Promise<PersonalBidWorkspace> {
  assertPersonalBidAccess(userId);
  const [market, rules] = await Promise.all([
    getLiveBidMarket(userId),
    listPersonalBidRules(userId),
  ]);
  return { market, rules, schedulingAvailable: hasSchedulerConfig() };
}

export async function readPersonalBidCount(userId: string, playerId: number) {
  assertPersonalBidAccess(userId);
  return getLivePlayerBidCount(userId, playerId);
}

export async function placePersonalBidNow(userId: string, raw: unknown) {
  assertPersonalBidAccess(userId);
  const input = parse(bidSchema, raw);
  return marketCommandService.placeBid(userId, input);
}

function hasSchedulerConfig() {
  return Boolean(
    process.env.QSTASH_TOKEN &&
    process.env.PERSONAL_BID_CALLBACK_URL &&
    process.env.QSTASH_CURRENT_SIGNING_KEY &&
    process.env.QSTASH_NEXT_SIGNING_KEY
  );
}

function schedulerConfig() {
  const token = process.env.QSTASH_TOKEN;
  const callbackUrl = process.env.PERSONAL_BID_CALLBACK_URL;
  if (
    !hasSchedulerConfig() ||
    !token ||
    !callbackUrl ||
    !/^https:\/\/[^/]+\/api\/personal\/bids\/execute$/.test(callbackUrl)
  ) {
    throw new PersonalBidError(
      'scheduler_unavailable',
      'La programación remota aún no está configurada.',
      503
    );
  }
  return { token, callbackUrl };
}

export async function schedulePersonalBid(userId: string, raw: unknown) {
  assertPersonalBidAccess(userId);
  const input = parse(ruleSchema, raw);
  const market = await getLiveBidMarket(userId);
  const listing = requireMatchingListing(market.listings, input.playerId, input.expectedListing);
  // Check the league capability now so a rule cannot be accepted if the count
  // would consume credits or is unavailable at execution time.
  await getLivePlayerBidCount(userId, input.playerId);
  if (
    input.amountWithoutBids < listing.price ||
    input.amountWithBids < listing.price ||
    input.amountWithoutBids > market.maximumBid ||
    input.amountWithBids > market.maximumBid
  ) {
    throw new PersonalBidError(
      'amount_out_of_range',
      'Los importes deben estar entre el precio y tu puja máxima.',
      409
    );
  }
  const executeAt = new Date(Date.parse(listing.closesAt) - input.minutesBeforeClose * 60_000);
  const waitMs = executeAt.getTime() - Date.now();
  if (waitMs < 60_000 || waitMs > 7 * 24 * 60 * 60_000 - 60_000) {
    throw new PersonalBidError(
      'schedule_window',
      'El envío debe quedar entre 1 minuto y 7 días desde ahora.',
      409
    );
  }
  const { token, callbackUrl } = schedulerConfig();
  const leagueId = Number(CONFIG.API.LEAGUE_ID);
  if (!Number.isSafeInteger(leagueId) || leagueId <= 0)
    throw new PersonalBidError('config', 'Liga no configurada.', 503);
  const id = randomUUID();
  let rule;
  try {
    rule = await insertPersonalBidRule({
      id,
      userId,
      leagueId,
      playerId: listing.playerId,
      playerName: listing.playerName,
      sellerId: listing.sellerId,
      listingPrice: listing.price,
      closesAt: new Date(listing.closesAt),
      executeAt,
      amountWithoutBids: input.amountWithoutBids,
      amountWithBids: input.amountWithBids,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new PersonalBidError(
        'already_scheduled',
        'Ya hay una puja activa para este anuncio.',
        409
      );
    }
    throw error;
  }
  try {
    const response = await new Client({ token }).publishJSON({
      url: callbackUrl,
      body: { ruleId: id },
      notBefore: Math.ceil(executeAt.getTime() / 1000),
      retries: 0,
    });
    await attachQueueMessage(id, response.messageId);
  } catch {
    await failScheduling(id);
    throw new PersonalBidError('queue_failed', 'No se pudo programar el envío remoto.', 503);
  }
  return rule;
}

export async function cancelScheduledPersonalBid(userId: string, id: string) {
  assertPersonalBidAccess(userId);
  if (!z.uuid().safeParse(id).success)
    throw new PersonalBidError('invalid_input', 'Regla no válida.');
  const rule = await cancelPersonalBidRule(userId, id);
  if (!rule) throw new PersonalBidError('not_pending', 'La puja ya no está pendiente.', 409);
  return rule;
}

export async function verifyPersonalBidWebhook(
  body: string,
  signature: string | null,
  url: string
) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  const callbackUrl = process.env.PERSONAL_BID_CALLBACK_URL;
  if (!currentSigningKey || !nextSigningKey || !callbackUrl || url !== callbackUrl || !signature)
    return false;
  try {
    return await new Receiver({ currentSigningKey, nextSigningKey }).verify({
      body,
      signature,
      url: callbackUrl,
    });
  } catch {
    return false;
  }
}

export async function executeScheduledPersonalBid(ruleId: string) {
  if (!z.uuid().safeParse(ruleId).success) return 'invalid';
  const rule = await claimPersonalBidRule(ruleId);
  if (!rule) return 'ignored';
  try {
    assertPersonalBidAccess(rule.userId);
    if (rule.leagueId !== Number(CONFIG.API.LEAGUE_ID))
      throw new PersonalBidError('league_changed', 'Liga cambiada.');
    const market = await getLiveBidMarket(rule.userId);
    const listing = requireMatchingListing(market.listings, rule.playerId, {
      sellerId: rule.sellerId,
      price: rule.listingPrice,
      closesAt: rule.closesAt.toISOString(),
    });
    if (Date.parse(listing.closesAt) - Date.now() < 120_000) {
      throw new PersonalBidError('too_late', 'Quedan menos de dos minutos para el cierre.');
    }
    const count = await getLivePlayerBidCount(rule.userId, rule.playerId);
    const amount = count.totalBids > 0 ? rule.amountWithBids : rule.amountWithoutBids;
    if (amount < listing.price || amount > market.maximumBid) {
      throw new PersonalBidError('amount_out_of_range', 'El importe ya no es válido.');
    }
    await marketCommandService.placeBid(rule.userId, {
      playerId: rule.playerId,
      amount,
      expectedListing: {
        sellerId: rule.sellerId,
        price: rule.listingPrice,
        closesAt: rule.closesAt.toISOString(),
      },
    });
    await finishPersonalBidRule(rule.id, 'submitted', 'bid_submitted', amount);
    return 'submitted';
  } catch (error) {
    if (error instanceof MarketBidOutcomeUnknownError) {
      await finishPersonalBidRule(rule.id, 'uncertain', 'provider_outcome_unknown');
      return 'uncertain';
    }
    const code =
      error instanceof PersonalBidError || error instanceof MarketBidConflictError
        ? error.code
        : error instanceof LiveBidCountUnavailableError
          ? 'count_unavailable'
          : 'execution_failed';
    await finishPersonalBidRule(rule.id, 'skipped', code);
    return 'skipped';
  }
}
