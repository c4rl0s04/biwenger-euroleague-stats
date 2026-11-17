import { describe, expect, it, vi } from 'vitest';
import { preparePlayerMutations } from '../players';
import { prepareUserMutations } from '../users';
import { prepareMarketMutations } from '../market';
import { prepareMarketListingMutations } from '../market-listings';
import { prepareMatchMutations } from '../matches';
import { prepareTournamentMutations } from '../tournaments';

describe('seasonal write boundaries', () => {
  it.each([
    preparePlayerMutations,
    prepareUserMutations,
    prepareMarketMutations,
    prepareMarketListingMutations,
    prepareMatchMutations,
    prepareTournamentMutations,
  ])('refuses an omitted or blank season before querying', (factory) => {
    const db = { query: vi.fn() };
    expect(() => factory(db, {})).toThrow('explicit seasonId');
    expect(() => factory(db, { seasonId: ' ' })).toThrow('explicit seasonId');
    expect(db.query).not.toHaveBeenCalled();
  });
});
