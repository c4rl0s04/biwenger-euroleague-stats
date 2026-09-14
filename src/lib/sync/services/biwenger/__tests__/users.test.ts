import { describe, expect, it, vi } from 'vitest';
import { syncBiwengerUsers } from '../users';

describe('Biwenger Users Service', () => {
  it('throws when seasonId is missing', async () => {
    const manager: any = {
      context: { db: {} },
      log: vi.fn(),
    };
    await expect(syncBiwengerUsers(manager)).rejects.toThrow(
      'Canonical sync season was not resolved before user ingestion.'
    );
  });

  it('upserts standings users and marks others inactive', async () => {
    const mockUpsertUser = vi.fn().mockResolvedValue(undefined);
    const mockMarkInactive = vi.fn().mockResolvedValue(undefined);

    const mockMutations: any = {
      upsertUser: mockUpsertUser,
      markSeasonUsersInactiveExcept: mockMarkInactive,
    };

    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const mockFetchLeague = vi.fn().mockResolvedValue({
      data: {
        standings: [
          { id: 10, name: 'Alice', icon: 'avatars/10.png' },
          { id: 20, name: 'Bob', icon: null },
        ],
      },
    });

    const result = await syncBiwengerUsers(manager, {
      fetchLeague: mockFetchLeague,
      prepareMutations: () => mockMutations,
    });

    expect(mockUpsertUser).toHaveBeenCalledTimes(2);
    expect(mockUpsertUser).toHaveBeenCalledWith({
      id: '10',
      name: 'Alice',
      icon: 'https://cdn.biwenger.com/avatars/10.png',
    });
    expect(mockUpsertUser).toHaveBeenCalledWith({
      id: '20',
      name: 'Bob',
      icon: null,
    });
    expect(mockMarkInactive).toHaveBeenCalledWith(['10', '20']);
    expect(result.counts.users).toBe(2);
  });
});
