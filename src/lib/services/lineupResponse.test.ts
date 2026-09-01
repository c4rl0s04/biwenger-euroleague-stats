import { describe, expect, it } from 'vitest';

import { createSafeLineupResponse } from './lineupResponse';

const CANARY_TOKEN = 'lineup-read-canary-token-never-expose';

describe('client lineup response boundary', () => {
  it('keeps only fields used by the lineup clients', () => {
    const result = createSafeLineupResponse({
      token: CANARY_TOKEN,
      email: 'private@example.com',
      lineup: {
        type: '2-2-1',
        playersID: [1, '2'],
        reservesID: [3],
        captain: 1,
        token: CANARY_TOKEN,
      },
      players: [{ id: 1, owner: { price: 500, token: CANARY_TOKEN } }],
      market: [
        {
          id: 9,
          playerID: 1,
          player: { id: 1, token: CANARY_TOKEN },
          price: 700,
          token: CANARY_TOKEN,
        },
      ],
      offers: [
        {
          id: 10,
          amount: 800,
          until: 2_000_000_000,
          requestedPlayers: [1],
          authorization: `Bearer ${CANARY_TOKEN}`,
        },
      ],
    });

    expect(result).toEqual({
      lineup: {
        type: '2-2-1',
        playersID: [1, '2'],
        reservesID: [3],
        captain: 1,
        striker: undefined,
        coach: undefined,
        date: undefined,
      },
      players: [{ id: 1, owner: { price: 500 } }],
      market: [{ id: 9, playerID: 1, player: { id: 1 }, price: 700 }],
      offers: [{ id: 10, amount: 800, until: 2_000_000_000, requestedPlayers: [1] }],
    });
    expect(JSON.stringify(result)).not.toContain(CANARY_TOKEN);
    expect(JSON.stringify(result)).not.toContain('token');
    expect(JSON.stringify(result)).not.toContain('authorization');
  });
});
