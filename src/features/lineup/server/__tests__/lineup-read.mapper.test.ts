import { describe, expect, it } from 'vitest';
import {
  mapToSafeLineupResponse,
  mapLineup,
  mapPlayers,
  mapMarket,
  mapOffers,
} from '../mappers/lineup-read.mapper';

const CANARY_TOKEN = 'lineup-read-canary-secret-token-do-not-leak';

describe('lineup-read.mapper', () => {
  it('maps complete provider data correctly and scrubs all credentials', () => {
    const rawData = {
      token: CANARY_TOKEN,
      email: 'user@example.com',
      authorization: `Bearer ${CANARY_TOKEN}`,
      lineup: {
        type: '2-2-1',
        playersID: [10, '20'],
        reservesID: [30],
        captain: 10,
        striker: 20,
        coach: 100,
        date: 1700000000,
        secret: CANARY_TOKEN,
      },
      players: [
        { id: 10, owner: { price: 15000000, token: CANARY_TOKEN } },
        { id: '20', owner: null },
      ],
      market: [
        {
          id: 101,
          playerID: 10,
          player: { id: 10, name: 'Ignored' },
          price: 16000000,
          token: CANARY_TOKEN,
        },
      ],
      offers: [
        {
          id: 501,
          amount: 14500000,
          until: 1710000000,
          requestedPlayers: [10],
          auth: CANARY_TOKEN,
        },
      ],
    };

    const result = mapToSafeLineupResponse(rawData);

    expect(result).toEqual({
      lineup: {
        type: '2-2-1',
        playersID: [10, '20'],
        reservesID: [30],
        captain: 10,
        striker: 20,
        coach: 100,
        date: 1700000000,
      },
      players: [
        { id: 10, owner: { price: 15000000 } },
        { id: '20', owner: null },
      ],
      market: [
        {
          id: 101,
          playerID: 10,
          player: { id: 10 },
          price: 16000000,
        },
      ],
      offers: [
        {
          id: 501,
          amount: 14500000,
          until: 1710000000,
          requestedPlayers: [10],
        },
      ],
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(CANARY_TOKEN);
    expect(serialized).not.toContain('user@example.com');
    expect(serialized).not.toContain('Bearer');
  });

  it('handles null, undefined, and empty objects gracefully', () => {
    expect(mapToSafeLineupResponse(null)).toEqual({
      lineup: null,
      players: [],
      market: [],
      offers: [],
    });

    expect(mapToSafeLineupResponse({})).toEqual({
      lineup: null,
      players: [],
      market: [],
      offers: [],
    });

    expect(mapLineup(null)).toBeNull();
    expect(mapLineup('string')).toBeNull();
    expect(mapPlayers(null)).toEqual([]);
    expect(mapMarket(undefined)).toEqual([]);
    expect(mapOffers([])).toEqual([]);
  });

  it('filters out non-record items and invalid numbers safely', () => {
    expect(mapPlayers([null, 'bad', { id: 'p1', owner: { price: 'not-a-number' } }])).toEqual([
      { id: 'p1', owner: { price: undefined } },
    ]);

    expect(mapMarket([{ id: 1, playerID: 'p1', player: 'invalid', price: NaN }])).toEqual([
      { id: 1, playerID: 'p1', player: null, price: undefined },
    ]);

    expect(mapOffers([{ id: 2, amount: Infinity, until: 12345, requestedPlayers: null }])).toEqual([
      { id: 2, amount: undefined, until: 12345, requestedPlayers: [] },
    ]);
  });
});
