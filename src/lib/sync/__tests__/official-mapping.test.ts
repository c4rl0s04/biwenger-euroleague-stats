import { describe, expect, it, vi } from 'vitest';
import { reconcilePlayerMappings, reconcileTeamMappings } from '../services/euroleague/mappings';

function mutations(overrides: Record<string, unknown> = {}) {
  return {
    getFantasyTeams: vi.fn(async () => []),
    getFantasyPlayers: vi.fn(async () => []),
    getPlayerMappings: vi.fn(async () => []),
    upsertTeamMapping: vi.fn(async () => undefined),
    upsertPlayerMapping: vi.fn(async () => undefined),
    ...overrides,
  } as any;
}

describe('season-scoped official mapping', () => {
  it('writes exact team matches and never writes an ambiguous fuzzy suggestion', async () => {
    const exact = mutations({
      getFantasyTeams: vi.fn(async () => [{ id: 1, name: 'Real Madrid', code: null }]),
    });
    await reconcileTeamMappings(exact, [{ code: 'MAD', name: 'Real Madrid' }]);
    expect(exact.upsertTeamMapping).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 1, matchMethod: 'exact_name' })
    );

    const ambiguous = mutations({
      getFantasyTeams: vi.fn(async () => [
        { id: 1, name: 'Madrid Basket', code: null },
        { id: 2, name: 'Madrid Basketball', code: null },
      ]),
    });
    const result = await reconcileTeamMappings(ambiguous, [{ code: 'MAD', name: 'Madrid' }]);
    expect(ambiguous.upsertTeamMapping).not.toHaveBeenCalled();
    expect(result.issues).toHaveLength(1);
  });

  it('maps players only by legacy code or exact name inside the mapped team', async () => {
    const store = mutations({
      getFantasyPlayers: vi.fn(async () => [
        {
          id: 7,
          name: 'Kai Jones',
          euroleague_code: null,
          provider_team_code: 'MAD',
        },
      ]),
    });
    const result = await reconcilePlayerMappings(store, [
      {
        gameCode: 1,
        playerCode: 'P014102',
        playerName: 'Kai Jones',
        teamCode: 'MAD',
        raw: {},
      } as any,
      {
        gameCode: 1,
        playerCode: 'P999999',
        playerName: 'Unknown Player',
        teamCode: 'MAD',
        raw: {},
      } as any,
    ]);
    expect(result.mapped).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(store.upsertPlayerMapping).toHaveBeenCalledWith(
      expect.objectContaining({ playerId: 7, status: 'matched', matchMethod: 'exact_name_team' })
    );
    expect(store.upsertPlayerMapping).toHaveBeenCalledWith(
      expect.objectContaining({ playerId: null, status: 'review_required' })
    );
  });

  it('refreshes official metadata without changing an existing manual player relation', async () => {
    const store = mutations({
      getPlayerMappings: vi.fn(async () => [
        {
          player_id: 7,
          provider_player_code: 'P014102',
          provider_team_code: 'MAD',
          status: 'matched',
        },
      ]),
    });

    const result = await reconcilePlayerMappings(store, [
      {
        playerCode: 'P014102',
        playerName: 'Kai Jones',
        teamCode: 'MAD',
        imageUrl: 'https://example.com/kai.png',
        age: 25,
        raw: {},
      } as any,
    ]);

    expect(result.mapped).toBe(1);
    expect(store.upsertPlayerMapping).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: 7,
        providerPlayerCode: 'P014102',
        imageUrl: 'https://example.com/kai.png',
        status: 'matched',
      })
    );
  });
});
