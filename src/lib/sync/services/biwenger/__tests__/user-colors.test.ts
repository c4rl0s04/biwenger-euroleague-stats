import { describe, expect, it, vi } from 'vitest';
import { syncUserColors } from '../user-colors';

describe('User Colors Service', () => {
  it('throws when seasonId is missing', async () => {
    const manager: any = {
      context: { db: {} },
      log: vi.fn(),
    };
    await expect(syncUserColors(manager)).rejects.toThrow(
      'Canonical sync season was not resolved before user color assignment.'
    );
  });

  it('handles empty user list cleanly', async () => {
    const mockMutations: any = {
      getAllUsers: vi.fn().mockResolvedValue({ all: () => [] }),
      updateUserColor: vi.fn(),
    };

    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const result = await syncUserColors(manager, {
      prepareMutations: () => mockMutations,
    });

    expect(result.counts).toEqual({ users: 0, updated: 0 });
    expect(mockMutations.updateUserColor).not.toHaveBeenCalled();
  });

  it('assigns colors via index % 13 and skips already correct values', async () => {
    const mockUpdateUserColor = vi.fn().mockResolvedValue(undefined);
    const mockMutations: any = {
      getAllUsers: vi.fn().mockResolvedValue({
        all: () => [
          { id: '1', name: 'Alice', color_index: 0 }, // index 0 % 13 = 0 (no update needed)
          { id: '2', name: 'Bob', color_index: 99 }, // index 1 % 13 = 1 (update needed)
          { id: '3', name: 'Charlie', color_index: null }, // index 2 % 13 = 2 (update needed)
        ],
      }),
      updateUserColor: mockUpdateUserColor,
    };

    const manager: any = {
      context: { db: {}, seasonId: '2025-26' },
      log: vi.fn(),
    };

    const result = await syncUserColors(manager, {
      prepareMutations: () => mockMutations,
    });

    expect(mockUpdateUserColor).toHaveBeenCalledTimes(2);
    expect(mockUpdateUserColor).toHaveBeenCalledWith(1, '2');
    expect(mockUpdateUserColor).toHaveBeenCalledWith(2, '3');
    expect(result.counts).toEqual({ users: 3, updated: 2 });
  });
});
