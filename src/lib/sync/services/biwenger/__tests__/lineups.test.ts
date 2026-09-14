import { describe, expect, it, vi } from 'vitest';
import { syncBiwengerLineups } from '../lineups';

describe('Biwenger Lineups Service', () => {
  it('skips processing when round is neither finished nor active', async () => {
    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const result = await syncBiwengerLineups(manager, {
      id: 1,
      name: 'Jornada 1',
      status: 'scheduled',
    });

    expect(result.insertedCount).toBe(0);
    expect(manager.log).toHaveBeenCalledWith('Skipping lineups (round not finished/active).');
  });

  it('syncs users, round points and lineups for a finished round', async () => {
    const mockUpsertUser = vi.fn().mockResolvedValue(undefined);
    const mockUpsertUserRound = vi.fn().mockResolvedValue(undefined);
    const mockDeleteUserLineup = vi.fn().mockResolvedValue(undefined);
    const mockUpsertLineup = vi.fn().mockResolvedValue(undefined);
    const mockUpsertPlayer = vi.fn().mockResolvedValue(undefined);

    const mockUserMutations: any = {
      upsertUser: mockUpsertUser,
      upsertUserRound: mockUpsertUserRound,
      deleteUserLineup: mockDeleteUserLineup,
      upsertLineup: mockUpsertLineup,
    };

    const mockPlayerMutations: any = {
      upsertPlayer: mockUpsertPlayer,
    };

    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
      resolveRoundId: vi.fn((r) => r.id),
    };

    const mockFetchRoundsLeague = vi.fn().mockResolvedValue({
      data: {
        round: {
          standings: [
            {
              id: 1,
              name: 'Alice',
              lineup: {
                count: 6,
                type: '5+1',
                points: 88,
                captain: { id: 101 },
                players: [101, 102, 103, 104, 105, 106],
              },
            },
          ],
        },
      },
    });

    const knownPlayers: Record<string, any> = {
      101: { id: 101, name: 'P1' },
      102: { id: 102, name: 'P2' },
      103: { id: 103, name: 'P3' },
      104: { id: 104, name: 'P4' },
      105: { id: 105, name: 'P5' },
      106: { id: 106, name: 'P6' },
    };

    const result = await syncBiwengerLineups(
      manager,
      { id: 1, name: 'Jornada 1', status: 'finished' },
      knownPlayers,
      {
        fetchRoundsLeague: mockFetchRoundsLeague,
        prepareUserMutations: () => mockUserMutations,
        preparePlayerMutations: () => mockPlayerMutations,
      }
    );

    expect(mockUpsertUser).toHaveBeenCalledWith({ id: '1', name: 'Alice', icon: null });
    expect(mockUpsertUserRound).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '1',
        round_id: 1,
        points: 88,
        participated: true,
      })
    );
    expect(mockDeleteUserLineup).toHaveBeenCalledWith({ user_id: '1', round_id: 1 });
    expect(mockUpsertLineup).toHaveBeenCalledTimes(6);
    expect(result.insertedCount).toBe(6);
  });
});
