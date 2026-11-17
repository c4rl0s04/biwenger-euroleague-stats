import { describe, expect, it } from 'vitest';
import {
  LiveMarketDataError,
  parseAccountAccess,
  parseLiveBidCount,
  parseLiveBidMarket,
  parsePlayerNames,
} from './mappers/live-bidding.mapper';

const market = {
  status: 200,
  data: {
    status: { balance: -200, maximumBid: 2_000_000 },
    sales: [
      { player: { id: 1 }, price: 1_000_000, until: 2_000_000_000, user: null },
      { player: { id: 2 }, price: 1_200_000, until: 2_000_000_000, user: { id: 8, name: 'Alex' } },
    ],
    offers: [
      { id: 11, status: 'waiting', amount: 1_300_000, from: { id: 7 }, requestedPlayers: [2] },
      { id: 12, status: 'waiting', amount: 1_400_000, from: null, requestedPlayers: [1] },
    ],
  },
};

describe('live Biwenger response mapping', () => {
  it('maps listings and only outgoing waiting offers from the actor', () => {
    const names = parsePlayerNames({
      status: 200,
      data: { players: { 1: { name: 'Jugador A' }, 2: { name: 'Jugador B' } } },
    });
    const result = parseLiveBidMarket(market, 7, names, '2026-10-04T00:00:00.000Z');
    expect(result.balance).toBe(-200);
    expect(result.maximumBid).toBe(2_000_000);
    expect(result.listings).toMatchObject([
      { playerId: 1, playerName: 'Jugador A', sellerId: null, ownWaitingOffers: [] },
      {
        playerId: 2,
        playerName: 'Jugador B',
        sellerId: 8,
        sellerName: 'Alex',
        ownWaitingOffers: [{ id: 11, amount: 1_300_000 }],
      },
    ]);
  });

  it('fails closed when own waiting offer cannot be linked to a player', () => {
    const broken = structuredClone(market);
    delete (broken.data.offers[0] as { requestedPlayers?: number[] }).requestedPlayers;
    expect(() => parseLiveBidMarket(broken, 7)).toThrow(LiveMarketDataError);
  });

  it('validates account ownership and free Premium bid counts', () => {
    const account = {
      status: 200,
      data: {
        leagues: [{ id: 9, type: 'premium', user: { id: 7 }, settings: { marketShowBids: true } }],
      },
    };
    expect(parseAccountAccess(account, 9, 7).canViewFreeBidCount).toBe(true);
    expect(
      parseAccountAccess(
        { ...account, data: { leagues: [{ ...account.data.leagues[0], type: 'ultra' }] } },
        9,
        7
      ).canViewFreeBidCount
    ).toBe(true);
    expect(() => parseAccountAccess(account, 9, 8)).toThrow(LiveMarketDataError);
    expect(
      parseAccountAccess(
        { ...account, data: { leagues: [{ ...account.data.leagues[0], type: 'normal' }] } },
        9,
        7
      ).canViewFreeBidCount
    ).toBe(false);
    expect(parseLiveBidCount({ status: 200, data: 0 })).toBe(0);
    expect(parseLiveBidCount({ status: 200, data: 2 })).toBe(2);
    expect(() => parseLiveBidCount({ status: 200, data: { amount: 123 } })).toThrow(
      LiveMarketDataError
    );
  });

  it('rejects malformed market state rather than treating it as empty', () => {
    expect(() => parseLiveBidMarket({ status: 200, data: { sales: [] } }, 7)).toThrow(
      LiveMarketDataError
    );
  });
});
