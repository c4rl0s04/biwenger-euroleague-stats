import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/provider/server', () => ({
  executeUserProviderQuery: vi.fn(),
  LINEUP_READ_FIELDS:
    '*,lineup(type,playersID,reservesID,captain,striker,coach,date),players(id,owner),market,offers,-trophies',
}));

import { executeUserProviderQuery } from '@/features/provider/server';
import { lineupReadService, LINEUP_READ_FIELDS } from '../services/lineup-read.service';

describe('lineupReadService', () => {
  const userId = 'user-42';
  const credential = 'decrypted-personal-token-42';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries provider with user context and returns sanitized lineup response', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        data: {
          lineup: { type: '2-2-1', playersID: [10, 20] },
          players: [{ id: 10, owner: { price: 500 } }],
          market: [],
          offers: [],
        },
      }),
    };

    vi.mocked(executeUserProviderQuery).mockImplementation(
      async (targetUserId, operation, runner) => {
        expect(targetUserId).toBe(userId);
        expect(operation).toBe('lineup.read');
        return runner(mockClient as any, { token: credential, userId: targetUserId });
      }
    );

    const result = await lineupReadService.getLineup(userId);

    expect(executeUserProviderQuery).toHaveBeenCalledWith(
      userId,
      'lineup.read',
      expect.any(Function)
    );
    expect(mockClient.query).toHaveBeenCalledWith(`/user?fields=${LINEUP_READ_FIELDS}`, {
      context: { token: credential, userId },
      cache: 'no-store',
    });
    expect(result).toEqual({
      lineup: {
        type: '2-2-1',
        playersID: [10, 20],
        reservesID: [],
        captain: undefined,
        striker: undefined,
        coach: undefined,
        date: undefined,
      },
      players: [{ id: 10, owner: { price: 500 } }],
      market: [],
      offers: [],
    });
  });

  it('rejects with error when userId is empty', async () => {
    await expect(lineupReadService.getLineup('')).rejects.toThrow(
      'User ID is required to fetch lineup'
    );
    expect(executeUserProviderQuery).not.toHaveBeenCalled();
  });

  it('propagates provider errors without leaking credentials', async () => {
    vi.mocked(executeUserProviderQuery).mockRejectedValue(
      new Error('Biwenger Rate Limit (429): Quota exceeded')
    );

    await expect(lineupReadService.getLineup(userId)).rejects.toThrow(
      'Biwenger Rate Limit (429): Quota exceeded'
    );
  });
});
