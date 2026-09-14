import { describe, expect, it, vi } from 'vitest';
import { simulateBacktracking, syncInitialSquads, type TransferHistoryItem } from '../backtracker';

describe('Roster Backtracker Service', () => {
  describe('simulateBacktracking', () => {
    it('removes bought players and re-adds sold players to reconstruct initial squads', () => {
      // User 1 currently owns players [101, 102]
      // User 2 currently owns players [201]
      const currentSquads = new Map<string, Set<number>>([
        ['1', new Set([101, 102])],
        ['2', new Set([201])],
      ]);

      const userNameToId = new Map<string, string>([
        ['Alice', '1'],
        ['Bob', '2'],
      ]);

      // Transfers sorted DESC (newest to oldest)
      const transfers: TransferHistoryItem[] = [
        // Alice bought 102 from Market (Alice did NOT have 102 at start -> delete 102)
        { timestamp: 100, player_id: 102, vendedor: 'Market', comprador: 'Alice' },
        // Alice sold 103 to Bob (Alice HAD 103 at start, Bob bought it -> add 103 to Alice, delete 103 from Bob)
        { timestamp: 50, player_id: 103, vendedor: 'Alice', comprador: 'Bob' },
      ];

      const initialSquads = simulateBacktracking(currentSquads, userNameToId, transfers);

      // Alice should have: 101 (always had), 103 (sold during season), NOT 102 (bought during season)
      const aliceSquad = initialSquads.get('1');
      expect(aliceSquad).toBeDefined();
      expect(Array.from(aliceSquad!).sort()).toEqual([101, 103]);

      // Bob should have: 201 (always had), NOT 103 (bought during season)
      const bobSquad = initialSquads.get('2');
      expect(bobSquad).toBeDefined();
      expect(Array.from(bobSquad!).sort()).toEqual([201]);
    });

    it('does not mutate the original currentSquads map or sets', () => {
      const originalSet = new Set([101]);
      const currentSquads = new Map<string, Set<number>>([['1', originalSet]]);
      const userNameToId = new Map<string, string>([['Alice', '1']]);
      const transfers: TransferHistoryItem[] = [
        { timestamp: 100, player_id: 101, vendedor: 'Market', comprador: 'Alice' },
      ];

      const result = simulateBacktracking(currentSquads, userNameToId, transfers);
      expect(result.get('1')?.has(101)).toBe(false);
      expect(currentSquads.get('1')?.has(101)).toBe(true);
      expect(originalSet.has(101)).toBe(true);
    });
  });

  describe('syncInitialSquads orchestration', () => {
    it('throws if seasonId is missing', async () => {
      const manager: any = {
        context: { db: {} },
        log: vi.fn(),
      };

      await expect(syncInitialSquads(manager)).rejects.toThrow(
        'Canonical sync season was not resolved before initial squads inference.'
      );
    });

    it('clears initial squads, runs simulation, resolves prices, and persists state', async () => {
      const mockClearInitialSquads = vi.fn().mockResolvedValue(undefined);
      const mockGetAllUsers = vi.fn().mockResolvedValue({
        all: () => [{ id: '1', name: 'Alice' }],
      });
      const mockGetPlayersOwnedByUser = vi.fn().mockResolvedValue([{ player_id: 101 }]);
      const mockGetTransfersForBacktracking = vi
        .fn()
        .mockResolvedValue([
          { timestamp: 100, player_id: 102, vendedor: 'Alice', comprador: 'Market' },
        ]);
      const mockGetInitialPrice = vi.fn().mockResolvedValue({ price: 2500000 });
      const mockInsertInitialSquad = vi.fn().mockResolvedValue(undefined);

      const mockMutations: any = {
        clearInitialSquads: mockClearInitialSquads,
        getAllUsers: mockGetAllUsers,
        getPlayersOwnedByUser: mockGetPlayersOwnedByUser,
        getTransfersForBacktracking: mockGetTransfersForBacktracking,
        getInitialPrice: mockGetInitialPrice,
        insertInitialSquad: mockInsertInitialSquad,
      };

      const manager: any = {
        context: { db: {}, seasonId: '2025-26' },
        log: vi.fn(),
      };

      const result = await syncInitialSquads(manager, {
        prepareMutations: () => mockMutations,
        seasonStartDate: '2025-10-01',
      });

      expect(mockClearInitialSquads).toHaveBeenCalledTimes(1);
      expect(mockInsertInitialSquad).toHaveBeenCalledTimes(2); // 101 (owned) and 102 (sold)
      expect(mockInsertInitialSquad).toHaveBeenCalledWith({
        user_id: '1',
        player_id: 101,
        price: 2500000,
      });
      expect(mockInsertInitialSquad).toHaveBeenCalledWith({
        user_id: '1',
        player_id: 102,
        price: 2500000,
      });
      expect(result.counts).toEqual({ users: 1, players: 2 });
    });
  });
});
