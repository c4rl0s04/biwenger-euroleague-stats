import { describe, expect, it, vi } from 'vitest';
import { syncFantasyPoints } from '../fantasy-points';

describe('Biwenger Fantasy Points Service', () => {
  it('throws when seasonId is missing', async () => {
    const manager: any = {
      context: { db: {} },
      log: vi.fn(),
    };
    await expect(syncFantasyPoints(manager, { id: 1, dbId: 1, name: 'Jornada 1' })).rejects.toThrow(
      'The writable season was not resolved.'
    );
  });

  it('iterates games and home/away reports to update player fantasy points', async () => {
    const mockUpdateFantasyPoints = vi.fn().mockResolvedValue(undefined);
    const mockMutations: any = {
      updateFantasyPoints: mockUpdateFantasyPoints,
    };

    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const mockFetchRoundGames = vi.fn().mockResolvedValue({
      data: {
        games: [
          {
            home: {
              reports: {
                1: { player: { id: 101 }, points: 15 },
              },
            },
            away: {
              reports: {
                1: { player: { id: 201 }, points: 22 },
                2: { player: { id: 202 }, points: -2 },
              },
            },
          },
        ],
      },
    });

    const updated = await syncFantasyPoints(
      manager,
      { id: 1, dbId: 1, name: 'Jornada 1' },
      {
        fetchRoundGames: mockFetchRoundGames,
        prepareMutations: () => mockMutations,
      }
    );

    expect(updated).toBe(3);
    expect(mockUpdateFantasyPoints).toHaveBeenCalledTimes(3);
    expect(mockUpdateFantasyPoints).toHaveBeenCalledWith({
      playerId: 101,
      roundId: 1,
      fantasyPoints: 15,
    });
    expect(mockUpdateFantasyPoints).toHaveBeenCalledWith({
      playerId: 201,
      roundId: 1,
      fantasyPoints: 22,
    });
    expect(mockUpdateFantasyPoints).toHaveBeenCalledWith({
      playerId: 202,
      roundId: 1,
      fantasyPoints: -2,
    });
  });
});
