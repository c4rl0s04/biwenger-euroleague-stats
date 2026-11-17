import { z } from 'zod';
import type { LiveBidMarket, LiveMarketListing } from '../../models/live-bidding';

const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const signedMoney = z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const sale = z.object({
  player: z.object({ id }),
  price: money,
  until: z.number().int().positive().max(8_640_000_000_000),
  user: z.object({ id, name: z.string().optional() }).nullable().optional(),
});
const offer = z.object({
  id: id.optional(),
  from: z.object({ id }).nullable().optional(),
  status: z.string(),
  requestedPlayers: z.array(id).optional(),
  amount: money.optional(),
});
const marketResponse = z.object({
  status: z.literal(200),
  data: z.object({
    status: z.object({ balance: signedMoney, maximumBid: money }),
    sales: z.array(sale),
    offers: z.array(offer),
  }),
});
const catalogueResponse = z.object({
  status: z.literal(200),
  data: z.object({ players: z.record(z.string(), z.object({ name: z.string().optional() })) }),
});
const accountResponse = z.object({
  status: z.literal(200),
  data: z.object({
    leagues: z.array(
      z.object({
        id,
        type: z.string(),
        user: z.object({ id }),
        settings: z.object({ marketShowBids: z.boolean().optional() }),
      })
    ),
  }),
});
const countResponse = z.object({
  status: z.literal(200),
  data: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

export class LiveMarketDataError extends Error {
  constructor(message = 'Biwenger returned invalid live market data') {
    super(message);
    this.name = 'LiveMarketDataError';
  }
}

export function parseAccountAccess(raw: unknown, leagueId: number, userId: number) {
  const result = accountResponse.safeParse(raw);
  if (!result.success) throw new LiveMarketDataError('Biwenger account response is invalid');
  const league = result.data.data.leagues.find((item) => item.id === leagueId);
  if (!league || league.user.id !== userId) {
    throw new LiveMarketDataError(
      'The linked Biwenger account does not own the configured league user'
    );
  }
  return {
    canViewFreeBidCount:
      (league.type === 'premium' || league.type === 'ultra') &&
      league.settings.marketShowBids === true,
  };
}

export function parsePlayerNames(raw: unknown): Record<number, string> {
  const result = catalogueResponse.safeParse(raw);
  if (!result.success) throw new LiveMarketDataError('Biwenger player catalogue is invalid');
  return Object.fromEntries(
    Object.entries(result.data.data.players)
      .filter(([key]) => /^\d+$/.test(key))
      .map(([key, player]) => [Number(key), player.name?.trim() || `Jugador ${key}`])
  );
}

export function parseLiveBidMarket(
  raw: unknown,
  userId: number,
  playerNames: Record<number, string> = {},
  observedAt = new Date().toISOString()
): LiveBidMarket {
  const result = marketResponse.safeParse(raw);
  if (!result.success) throw new LiveMarketDataError();
  const { sales, offers, status } = result.data.data;
  const ownWaitingOffers = offers.filter(
    (item) => item.status === 'waiting' && item.from?.id === userId
  );
  if (ownWaitingOffers.some((item) => !item.requestedPlayers)) {
    throw new LiveMarketDataError('Own waiting offers have no player information');
  }
  const listings: LiveMarketListing[] = sales.map((item) => ({
    playerId: item.player.id,
    playerName: playerNames[item.player.id] || `Jugador ${item.player.id}`,
    sellerId: item.user?.id ?? null,
    sellerName:
      item.user?.name?.trim() || (item.user?.id ? `Mánager ${item.user.id}` : 'Mercado libre'),
    price: item.price,
    closesAt: new Date(item.until * 1000).toISOString(),
    isOwnListing: item.user?.id === userId,
    ownWaitingOffers: ownWaitingOffers
      .filter((pending) => pending.requestedPlayers?.includes(item.player.id))
      .map((pending) => ({ id: pending.id ?? null, amount: pending.amount ?? null })),
  }));
  return { balance: status.balance, maximumBid: status.maximumBid, observedAt, listings };
}

export function parseLiveBidCount(raw: unknown): number {
  const result = countResponse.safeParse(raw);
  if (!result.success) throw new LiveMarketDataError('Biwenger returned an invalid bid count');
  return result.data.data;
}
