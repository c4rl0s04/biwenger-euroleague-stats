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

const profile = (playerName: string, playerCode = 'P015244', teamCode: string | null = 'MAD') => ({
  playerCode,
  playerName,
  teamCode,
  teamName: null,
  imageUrl: null,
  teamImageUrl: null,
  age: null,
  raw: {},
});
const candidate = (
  name: string,
  id = 42134,
  provider_team_code: string | null = 'MAD',
  euroleague_code: string | null = null
) => ({ id, name, team_id: 579, provider_team_code, euroleague_code });

describe('official roster aliases', () => {
  it.each([
    ['SMITH JR.', 'SMITH JR, NICK', 'exact_surname_team'],
    ['De la Cruz III', 'DÉ LA CRUZ III, LUIS', 'exact_surname_team'],
    ['Nick Smith Jr.', 'SMITH JR, NICK', 'exact_name_team'],
  ])('uses the same decision in preview and apply for %s', async (name, officialName, method) => {
    const store = mutations({
      getFantasyPlayers: vi.fn(async () => [candidate(name)]),
      getPlayerMappings: vi.fn(async () => [
        { player_id: null, provider_player_code: 'P015244', status: 'review_required' },
      ]),
    });
    const official = [profile(officialName)];
    const preview = await reconcilePlayerMappings(store, official, {
      allowSurname: true,
      preview: true,
    });
    expect(store.upsertPlayerMapping).not.toHaveBeenCalled();
    expect(preview.decisions).toEqual([
      expect.objectContaining({ playerId: 42134, providerCode: 'P015244', method }),
    ]);
    expect(await reconcilePlayerMappings(store, official, { allowSurname: true })).toEqual(preview);
    expect(store.upsertPlayerMapping).toHaveBeenCalledWith(
      expect.objectContaining({ playerId: 42134, status: 'matched', matchMethod: method })
    );
  });

  it.each([
    ['different suffix', [candidate('SMITH III')], [profile('SMITH JR, NICK')], []],
    [
      'duplicate fantasy surname',
      [candidate('SMITH JR'), candidate('SMITH JR.', 2)],
      [profile('SMITH JR, NICK')],
      [],
    ],
    [
      'duplicate official surname',
      [candidate('SMITH JR')],
      [profile('SMITH JR, NICK'), profile('SMITH JR, ADAM', 'P015245')],
      [],
    ],
    [
      'missing team',
      [candidate('SMITH JR', 42134, null)],
      [profile('SMITH JR, NICK', 'P015244', null)],
      [],
    ],
    [
      'conflicting code',
      [candidate('SMITH JR', 42134, 'MAD', 'P015245')],
      [profile('SMITH JR, NICK')],
      [],
    ],
    [
      'existing link',
      [candidate('SMITH JR')],
      [profile('SMITH JR, NICK')],
      [{ player_id: 42134, provider_player_code: 'P015245', status: 'matched' }],
    ],
  ])('leaves %s in review', async (_reason, players, official, existing) => {
    const store = mutations({
      getFantasyPlayers: vi.fn(async () => players),
      getPlayerMappings: vi.fn(async () => existing),
    });
    const result = await reconcilePlayerMappings(store, official, { allowSurname: true });
    expect(result.mapped).toBe(0);
    expect(result.issues).toHaveLength(official.length);
  });

  it('leaves competing claims pending regardless of profile order', async () => {
    const store = mutations({ getFantasyPlayers: vi.fn(async () => [candidate('Smith Jr')]) });
    const officials = [profile('SMITH JR, NICK'), profile('SMITH JR', 'P015245')];
    for (const order of [officials, [...officials].reverse()]) {
      const result = await reconcilePlayerMappings(store, order, { allowSurname: true });
      expect(result.mapped).toBe(0);
      expect(result.issues.map((issue) => issue.reason)).toEqual([
        'Multiple official codes claim this player',
        'Multiple official codes claim this player',
      ]);
    }
  });

  it('retries out-of-order arrivals, preserves links, and leaves aliases unresolved in a boxscore', async () => {
    const getFantasyPlayers = vi
      .fn<() => Promise<ReturnType<typeof candidate>[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValue([candidate('SMITH JR.')]);
    const getPlayerMappings = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { player_id: null, provider_player_code: 'P015244', status: 'review_required' },
      ])
      .mockResolvedValueOnce([
        { player_id: 42134, provider_player_code: 'P015244', status: 'matched' },
      ])
      .mockResolvedValue([]);
    const store = mutations({ getFantasyPlayers, getPlayerMappings });
    const officials = [profile('SMITH JR, NICK')];
    expect((await reconcilePlayerMappings(store, officials, { allowSurname: true })).mapped).toBe(
      0
    );
    expect((await reconcilePlayerMappings(store, officials, { allowSurname: true })).mapped).toBe(
      1
    );
    expect(
      (await reconcilePlayerMappings(store, officials, { allowSurname: true })).decisions
    ).toEqual([]);
    expect((await reconcilePlayerMappings(store, officials)).mapped).toBe(0);
  });
});
