import 'server-only';

import { CONFIG } from '@/lib/config';
import {
  executeUserProviderQuery,
  type BiwengerProviderClient,
  type BiwengerRequestContext,
} from '@/features/provider/server';
import type { LiveBidCount, LiveBidMarket } from '../../models/live-bidding';
import {
  LiveMarketDataError,
  parseAccountAccess,
  parseLiveBidCount,
  parseLiveBidMarket,
  parsePlayerNames,
} from '../mappers/live-bidding.mapper';

export const LIVE_BIDDING_POLICY = Object.freeze({
  access: 'authenticated-linked-manager',
  freshness: 'live-provider-no-store',
  bidCountCost: 'premium-only-zero-credit',
} as const);

export class LiveBidCountUnavailableError extends Error {
  constructor() {
    super('El contador de pujas no está disponible sin gastar créditos en esta liga.');
    this.name = 'LiveBidCountUnavailableError';
  }
}

export function getLiveBidActor(userId: string, context: BiwengerRequestContext) {
  const leagueId = String(CONFIG.API.LEAGUE_ID ?? '');
  if (!/^\d+$/.test(userId) || !/^\d+$/.test(leagueId)) {
    throw new LiveMarketDataError('Invalid market account or league configuration');
  }
  const actorId = Number(userId);
  const numericLeagueId = Number(leagueId);
  if (
    !Number.isSafeInteger(actorId) ||
    actorId <= 0 ||
    !Number.isSafeInteger(numericLeagueId) ||
    numericLeagueId <= 0
  ) {
    throw new LiveMarketDataError('Invalid market account or league configuration');
  }
  return {
    actorId,
    leagueId: numericLeagueId,
    providerContext: { ...context, userId, leagueId },
  };
}

export async function readLiveBidMarket(
  client: BiwengerProviderClient,
  context: BiwengerRequestContext,
  userId: string,
  includeNames = false
) {
  const actor = getLiveBidActor(userId, context);
  const accountRaw: unknown = await client.query(
    '/account',
    { skipVersionCheck: true, cache: 'no-store' },
    actor.providerContext
  );
  const access = parseAccountAccess(accountRaw, actor.leagueId, actor.actorId);
  const marketRaw: unknown = await client.query(
    '/market',
    { cache: 'no-store' },
    actor.providerContext
  );
  const names = includeNames
    ? parsePlayerNames(
        await client.query(
          '/competitions/euroleague/data?lang=es',
          { cache: 'no-store' },
          actor.providerContext
        )
      )
    : {};
  return {
    access,
    market: parseLiveBidMarket(marketRaw, actor.actorId, names),
    providerContext: actor.providerContext,
  };
}

export function requireLiveListing(market: LiveBidMarket, playerId: number) {
  const matches = market.listings.filter((listing) => listing.playerId === playerId);
  if (matches.length !== 1) {
    throw new LiveMarketDataError(
      matches.length
        ? 'Biwenger returned ambiguous listings for this player'
        : 'Player is not in the live market'
    );
  }
  return matches[0];
}

export async function getLiveBidMarket(userId: string): Promise<LiveBidMarket> {
  return executeUserProviderQuery(userId, 'market.live.read', async (client, context) => {
    const { market } = await readLiveBidMarket(client, context, userId, true);
    return market;
  });
}

export async function getLivePlayerBidCount(
  userId: string,
  playerId: number
): Promise<LiveBidCount> {
  if (!Number.isSafeInteger(playerId) || playerId <= 0) {
    throw new LiveMarketDataError('Invalid player ID');
  }
  return executeUserProviderQuery(userId, 'market.bids.count', async (client, context) => {
    const { market, access, providerContext } = await readLiveBidMarket(client, context, userId);
    const listing = requireLiveListing(market, playerId);
    if (listing.isOwnListing || !access.canViewFreeBidCount) {
      throw new LiveBidCountUnavailableError();
    }
    // Biwenger uses POST for this read. It can consume credits outside Premium leagues,
    // so the capability check above is mandatory and the request is never retried.
    const result = await client.command(
      '/market/bids',
      {
        method: 'POST',
        body: { player: playerId, ...(listing.sellerId ? { user: listing.sellerId } : {}) },
        retries: 0,
      },
      providerContext
    );
    return {
      playerId,
      totalBids: parseLiveBidCount(result.raw),
      observedAt: new Date().toISOString(),
    };
  });
}
