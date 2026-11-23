import 'server-only';

import { z } from 'zod';
import type { BiwengerProviderClient, BiwengerRequestContext } from '@/features/provider/server';
import { MarketCommandValidationError } from '../../validation/market-command.schema';

const id = z
  .union([z.number(), z.string().regex(/^[1-9]\d*$/)])
  .transform(Number)
  .pipe(z.number().int().positive());
const squad = z.object({ players: z.array(z.object({ id })) });
const offers = z.object({
  offers: z.array(
    z.object({
      id,
      requestedPlayers: z.array(id).nullish(),
      status: z.string().optional(),
    })
  ),
});

async function readAccount(
  client: BiwengerProviderClient,
  context: BiwengerRequestContext,
  fields: string
) {
  const response = await client.query<unknown>(`/user?fields=${fields}`, {
    context,
    cache: 'no-store',
  });
  return response && typeof response === 'object' && 'data' in response ? response.data : response;
}

export async function resolveOfferedPlayer(
  client: BiwengerProviderClient,
  context: BiwengerRequestContext,
  offerId: number,
  requestedPlayerId?: number
) {
  const account = await readAccount(client, context, 'players(id),offers');
  const { players } = squad.parse(account);
  const candidates = offers.parse(account).offers.filter((offer) => offer.id === offerId);
  const offer = candidates[0];
  const requested = offer?.requestedPlayers;
  if (
    candidates.length !== 1 ||
    (offer.status !== undefined && offer.status !== 'waiting') ||
    requested?.length !== 1 ||
    (requestedPlayerId !== undefined && requested[0] !== requestedPlayerId) ||
    !players.some(({ id: ownedId }) => ownedId === requested[0])
  ) {
    throw new MarketCommandValidationError(
      'La oferta no coincide con tu plantilla actual en Biwenger.'
    );
  }
  return requested[0];
}

export async function hasPlayerLeftSquad(
  client: BiwengerProviderClient,
  context: BiwengerRequestContext,
  playerId: number
) {
  const { players } = squad.parse(await readAccount(client, context, 'players(id)'));
  return !players.some(({ id: ownedId }) => ownedId === playerId);
}
