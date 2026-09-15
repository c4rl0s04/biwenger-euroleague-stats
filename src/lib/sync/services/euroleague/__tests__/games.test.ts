import { describe, expect, it, vi } from 'vitest';
import { runGame } from '../games';

describe('Euroleague runGame service', () => {
  const sampleBoxscore = [
    {
      gameCode: 1,
      playerCode: 'P001',
      playerName: 'Player One',
      teamCode: 'MAD',
      isHome: true,
      isStarter: true,
      isPlaying: false,
      dorsal: '1',
      minutes: '15:00',
      minutesSeconds: 900,
      isDnp: false,
      points: 10,
      twoPointsMade: 3,
      twoPointsAttempted: 5,
      threePointsMade: 1,
      threePointsAttempted: 2,
      freeThrowsMade: 1,
      freeThrowsAttempted: 2,
      offensiveRebounds: 1,
      defensiveRebounds: 2,
      totalRebounds: 3,
      assists: 2,
      steals: 1,
      turnovers: 1,
      blocks: 0,
      blocksAgainst: 0,
      foulsCommitted: 2,
      foulsReceived: 2,
      valuation: 12,
      plusMinus: 5,
      raw: {},
    },
  ];

  function createHarness() {
    const mockProvider = {
      getGameReport: vi.fn(async () => ({ isPlayed: true, homeScore: 80, awayScore: 75 })),
      getGameMetadata: vi.fn(async () => ({ isLive: false })),
      getPlayerBoxScore: vi.fn(async () => sampleBoxscore),
      getPlayByPlay: vi.fn(async () => []),
      getShots: vi.fn(async () => []),
    };

    const manager: any = {
      context: {
        db: {},
        season: { euroleagueCode: 'E2026', seasonId: '2026-27' },
        euroleague: mockProvider,
      },
      log: vi.fn(),
    };

    const mockGameMutations: any = {
      persistGameData: vi.fn(async () => ({})),
      materializeRoundStats: vi.fn(async () => ({})),
      hasUnpersistedMappedPlayers: vi.fn(async () => false),
    };

    const mockMappingMutations: any = {
      getFantasyPlayers: vi.fn(async () => []),
      getPlayerMappings: vi.fn(async () => []),
      upsertPlayerMapping: vi.fn(async () => undefined),
    };

    return { manager, mockGameMutations, mockMappingMutations, mockProvider };
  }

  it('persists game data on first ingestion and returns updated status', async () => {
    const { manager, mockGameMutations, mockMappingMutations } = createHarness();

    const result = await runGame(manager, 1, 10, 'Jornada 10', {
      gameMutations: mockGameMutations,
      mappingMutations: mockMappingMutations,
    });

    expect(result.status).toBe('updated');
    expect(result.finalized).toBe(true);
    expect(mockGameMutations.persistGameData).toHaveBeenCalledTimes(1);
    expect(mockGameMutations.materializeRoundStats).toHaveBeenCalledWith(10);
  });

  it('skips persistence when checksum is unchanged and all mapped players are persisted', async () => {
    const { manager, mockGameMutations, mockMappingMutations } = createHarness();

    const firstRun = await runGame(manager, 1, 10, 'Jornada 10', {
      gameMutations: mockGameMutations,
      mappingMutations: mockMappingMutations,
    });
    const checksum = firstRun.checksum;

    mockGameMutations.persistGameData.mockClear();
    mockGameMutations.hasUnpersistedMappedPlayers.mockResolvedValue(false);

    const secondRun = await runGame(manager, 1, 10, 'Jornada 10', {
      existingChecksum: checksum,
      gameMutations: mockGameMutations,
      mappingMutations: mockMappingMutations,
    });

    expect(secondRun.status).toBe('unchanged');
    expect(mockGameMutations.persistGameData).not.toHaveBeenCalled();
  });

  it('re-runs persistence when checksum is unchanged but a newly mapped player needs stats persistence', async () => {
    const { manager, mockGameMutations, mockMappingMutations } = createHarness();

    const firstRun = await runGame(manager, 1, 10, 'Jornada 10', {
      gameMutations: mockGameMutations,
      mappingMutations: mockMappingMutations,
    });
    const checksum = firstRun.checksum;

    mockGameMutations.persistGameData.mockClear();

    // Later: mapping is resolved in DB, so hasUnpersistedMappedPlayers returns true
    mockGameMutations.hasUnpersistedMappedPlayers.mockResolvedValue(true);

    const secondRun = await runGame(manager, 1, 10, 'Jornada 10', {
      existingChecksum: checksum,
      gameMutations: mockGameMutations,
      mappingMutations: mockMappingMutations,
    });

    expect(secondRun.status).toBe('updated');
    expect(mockGameMutations.persistGameData).toHaveBeenCalledTimes(1);
    expect(mockGameMutations.hasUnpersistedMappedPlayers).toHaveBeenCalledWith(10, ['P001']);
  });
});
