import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/provider/server', () => {
  class MockMutationError extends Error {
    constructor(
      message: string,
      public status?: number,
      public endpoint?: string
    ) {
      super(message);
      this.name = 'BiwengerMutationError';
    }
  }

  return {
    executeUserProviderCommand: vi.fn(),
    BiwengerMutationError: MockMutationError,
    BiwengerRateLimitError: class extends MockMutationError {},
    BiwengerAuthError: class extends MockMutationError {},
    BiwengerNetworkError: class extends MockMutationError {},
  };
});

import { executeUserProviderCommand, BiwengerMutationError } from '@/features/provider/server';
import { lineupCommandService } from '../services/lineup-command.service';
import { LineupValidationError } from '../../validation/lineup-command.schema';

describe('lineupCommandService', () => {
  const userId = 'user-42';
  const credential = 'decrypted-personal-token-42';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits validated lineup mutation via executeUserProviderCommand', async () => {
    const mockClient = {
      command: vi.fn().mockResolvedValue({
        status: 'completed',
        httpStatus: 200,
        raw: { status: 200 },
      }),
    };

    vi.mocked(executeUserProviderCommand).mockImplementation(
      async (targetUserId, operation, runner) => {
        expect(targetUserId).toBe(userId);
        expect(operation).toBe('lineup.update');
        return runner(mockClient as any, { token: credential, userId: targetUserId });
      }
    );

    const validPayload = {
      type: '1-2-2',
      playersID: [101, 102, 103, 104, 105],
      reservesID: [201, 202],
      captain: 101,
    };

    const result = await lineupCommandService.updateLineup(userId, validPayload);

    expect(executeUserProviderCommand).toHaveBeenCalledWith(
      userId,
      'lineup.update',
      expect.any(Function)
    );
    expect(mockClient.command).toHaveBeenCalledWith('/user', {
      method: 'PUT',
      body: {
        lineup: {
          type: '1-2-2',
          playersID: [101, 102, 103, 104, 105],
          reservesID: [201, 202],
          captain: 101,
          coach: undefined,
          striker: undefined,
        },
      },
      context: { token: credential, userId },
    });
    expect(result).toEqual({
      status: 'completed',
      message: 'Alineación actualizada en Biwenger',
    });
  });

  it('rejects with LineupValidationError and defends provider before decrypting credentials', async () => {
    // 1. Empty payload
    await expect(lineupCommandService.updateLineup(userId, null)).rejects.toThrow(
      LineupValidationError
    );

    // 2. Missing playersID
    await expect(
      lineupCommandService.updateLineup(userId, { type: '1-2-2', playersID: [] })
    ).rejects.toThrow('Se requiere al menos un jugador');

    // 3. Invalid playersID format
    await expect(
      lineupCommandService.updateLineup(userId, { type: '1-2-2', playersID: [''] })
    ).rejects.toThrow(LineupValidationError);

    expect(executeUserProviderCommand).not.toHaveBeenCalled();
  });

  it('rejects with error when userId is missing', async () => {
    await expect(lineupCommandService.updateLineup('', { playersID: [101] })).rejects.toThrow(
      'User ID is required to update lineup'
    );
    expect(executeUserProviderCommand).not.toHaveBeenCalled();
  });

  it('propagates provider mutation errors and redacts any secret tokens', async () => {
    const canaryToken = 'lineup-secret-canary-token-999';
    vi.mocked(executeUserProviderCommand).mockRejectedValue(
      new Error(`Failed with Bearer ${canaryToken}`)
    );

    try {
      await lineupCommandService.updateLineup(userId, { playersID: [101] });
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BiwengerMutationError);
      expect(err.message).not.toContain(canaryToken);
      expect(err.message).not.toContain('Bearer');
    }
  });
});
