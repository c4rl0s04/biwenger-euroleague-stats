import 'server-only';

import {
  executeUserProviderCommand,
  BiwengerMutationError,
  BiwengerRateLimitError,
  BiwengerAuthError,
  BiwengerNetworkError,
} from '@/features/provider/server';
import type { LineupCommandInput, LineupCommandResult } from '../../models/lineup';
import {
  validateLineupCommand,
  LineupValidationError,
} from '../../validation/lineup-command.schema';

export interface LineupCommandService {
  updateLineup(userId: string, input: unknown): Promise<LineupCommandResult>;
}

export const lineupCommandService: LineupCommandService = {
  /**
   * Updates the user's active fantasy lineup on Biwenger.
   *
   * Validates input schemas at the system boundary before decrypting credentials.
   * Submits mutations via `executeUserProviderCommand` which enforces a fail-closed,
   * zero-retry policy on network errors and rate limits to prevent duplicate mutations.
   *
   * @param userId - The authenticated user's ID
   * @param input - The lineup payload object ({ type, playersID, reservesID, captain, ... })
   * @returns LineupCommandResult
   */
  async updateLineup(userId: string, input: unknown): Promise<LineupCommandResult> {
    if (!userId) {
      throw new Error('User ID is required to update lineup');
    }

    const validatedLineup = validateLineupCommand(input);

    try {
      await executeUserProviderCommand(userId, 'lineup.update', async (client, context) => {
        return client.command('/user', {
          method: 'PUT',
          body: { lineup: validatedLineup },
          context,
        });
      });

      return {
        status: 'completed',
        message: 'Alineación actualizada en Biwenger',
      };
    } catch (error: unknown) {
      if (
        error instanceof LineupValidationError ||
        error instanceof BiwengerMutationError ||
        error instanceof BiwengerRateLimitError ||
        error instanceof BiwengerAuthError ||
        error instanceof BiwengerNetworkError
      ) {
        throw error;
      }

      const message =
        error instanceof Error &&
        !error.message.includes('token') &&
        !error.message.includes('Bearer')
          ? error.message
          : 'Biwenger no pudo completar la operación solicitada.';

      throw new BiwengerMutationError(message, undefined, '/user');
    }
  },
};
