import 'server-only';

import {
  executeUserProviderCommand,
  BiwengerMutationError,
  BiwengerRateLimitError,
  BiwengerAuthError,
  BiwengerNetworkError,
} from '@/features/provider/server';
import type {
  SellPlayerResult,
  SellAllResult,
  WithdrawPlayerResult,
  AcceptOfferResult,
  RejectOfferResult,
} from '../../models/market-command.models';
import {
  validateSellPlayerInput,
  validateSellAllInput,
  validateWithdrawPlayerInput,
  validateAcceptOfferInput,
  validateRejectOfferInput,
  MarketCommandValidationError,
} from '../../validation/market-command.schema';
import {
  marketCommandRepository,
  type MarketCommandRepository,
} from '../repositories/market-command.repository';

function sanitizeErrorMessage(error: unknown, fallback: string): string {
  if (
    error instanceof Error &&
    !error.message.includes('token') &&
    !error.message.includes('Bearer') &&
    !error.message.includes('authorization')
  ) {
    return error.message;
  }
  return fallback;
}

export interface MarketCommandService {
  sellPlayer(userId: string, input: unknown): Promise<SellPlayerResult>;
  sellAllSquad(userId: string, input: unknown): Promise<SellAllResult>;
  withdrawPlayer(userId: string, input: unknown): Promise<WithdrawPlayerResult>;
  acceptOffer(userId: string, input: unknown): Promise<AcceptOfferResult>;
  rejectOffer(userId: string, input: unknown): Promise<RejectOfferResult>;
}

export function createMarketCommandService(
  repository: MarketCommandRepository = marketCommandRepository
): MarketCommandService {
  return {
    /**
     * Lists a player on the Biwenger market or executes an immediate sale.
     * Enforces fail-closed provider boundaries and updates local ownership on immediate sales.
     */
    async sellPlayer(userId: string, input: unknown): Promise<SellPlayerResult> {
      if (!userId) {
        throw new Error('User ID is required to list players on the market');
      }

      const validated = validateSellPlayerInput(input);

      try {
        await executeUserProviderCommand(userId, 'market.place', async (client, context) => {
          return client.command('/market', {
            method: 'POST',
            body: {
              type: validated.type,
              player: validated.playerId,
              price: validated.price,
            },
            context,
          });
        });

        if (validated.type === 'immediateSell') {
          try {
            await repository.clearLocalPlayerOwner(validated.playerId);
            console.log(
              `[DB] Successfully set player ${validated.playerId} season owner to null after immediateSell`
            );
          } catch (dbErr) {
            console.error('Failed to update player owner in DB after immediate sell:', dbErr);
          }
        }

        return {
          status: 'completed',
          playerId: validated.playerId,
          mode: validated.type ?? 'sell',
          message: 'Jugador procesado en el mercado correctamente',
        };
      } catch (error: unknown) {
        if (
          error instanceof MarketCommandValidationError ||
          error instanceof BiwengerMutationError ||
          error instanceof BiwengerRateLimitError ||
          error instanceof BiwengerAuthError ||
          error instanceof BiwengerNetworkError
        ) {
          throw error;
        }

        const safeMessage = sanitizeErrorMessage(
          error,
          'Biwenger no pudo completar la venta del jugador.'
        );
        throw new BiwengerMutationError(safeMessage, undefined, '/market');
      }
    },

    /**
     * Lists all squad players on the market at a given percentage of their value.
     */
    async sellAllSquad(userId: string, input: unknown): Promise<SellAllResult> {
      if (!userId) {
        throw new Error('User ID is required to list squad on the market');
      }

      const validated = validateSellAllInput(input);

      try {
        await executeUserProviderCommand(userId, 'market.place-team', async (client, context) => {
          return client.command('/market', {
            method: 'POST',
            body: {
              type: 'team',
              price: validated.pricePercentage,
            },
            context,
          });
        });

        return {
          status: 'completed',
          message: 'Plantilla entera puesta en mercado',
        };
      } catch (error: unknown) {
        if (
          error instanceof MarketCommandValidationError ||
          error instanceof BiwengerMutationError ||
          error instanceof BiwengerRateLimitError ||
          error instanceof BiwengerAuthError ||
          error instanceof BiwengerNetworkError
        ) {
          throw error;
        }

        const safeMessage = sanitizeErrorMessage(
          error,
          'Biwenger no pudo completar la venta masiva de la plantilla.'
        );
        throw new BiwengerMutationError(safeMessage, undefined, '/market');
      }
    },

    /**
     * Withdraws a player listing from the Biwenger market.
     */
    async withdrawPlayer(userId: string, input: unknown): Promise<WithdrawPlayerResult> {
      if (!userId) {
        throw new Error('User ID is required to withdraw player from market');
      }

      const validated = validateWithdrawPlayerInput(input);

      try {
        await executeUserProviderCommand(userId, 'market.withdraw', async (client, context) => {
          return client.command(`/market?player=${validated.playerId}`, {
            method: 'DELETE',
            context,
          });
        });

        return {
          status: 'completed',
          playerId: validated.playerId,
          message: 'Jugador retirado del mercado correctamente',
        };
      } catch (error: unknown) {
        if (
          error instanceof MarketCommandValidationError ||
          error instanceof BiwengerMutationError ||
          error instanceof BiwengerRateLimitError ||
          error instanceof BiwengerAuthError ||
          error instanceof BiwengerNetworkError
        ) {
          throw error;
        }

        const safeMessage = sanitizeErrorMessage(
          error,
          'Biwenger no pudo retirar al jugador del mercado.'
        );
        throw new BiwengerMutationError(
          safeMessage,
          undefined,
          `/market?player=${validated.playerId}`
        );
      }
    },

    /**
     * Accepts an incoming transfer offer on Biwenger.
     * If playerId is provided, updates local player ownership to null.
     */
    async acceptOffer(userId: string, input: unknown): Promise<AcceptOfferResult> {
      if (!userId) {
        throw new Error('User ID is required to accept transfer offers');
      }

      const validated = validateAcceptOfferInput(input);

      try {
        await executeUserProviderCommand(userId, 'offer.accept', async (client, context) => {
          return client.command(`/offers/${validated.offerId}`, {
            method: 'PUT',
            body: {
              status: 'accepted',
            },
            context,
          });
        });

        if (validated.playerId) {
          try {
            await repository.clearLocalPlayerOwner(validated.playerId);
            console.log(
              `[DB] Successfully set player ${validated.playerId} season owner to null after accepting offer`
            );
          } catch (dbErr) {
            console.error('Failed to update player owner in DB after offer acceptance:', dbErr);
          }
        }

        return {
          status: 'completed',
          offerId: validated.offerId,
          ...(validated.playerId ? { playerId: validated.playerId } : {}),
          message: 'Oferta aceptada correctamente',
        };
      } catch (error: unknown) {
        if (
          error instanceof MarketCommandValidationError ||
          error instanceof BiwengerMutationError ||
          error instanceof BiwengerRateLimitError ||
          error instanceof BiwengerAuthError ||
          error instanceof BiwengerNetworkError
        ) {
          throw error;
        }

        const safeMessage = sanitizeErrorMessage(
          error,
          'Biwenger no pudo completar la aceptación de la oferta.'
        );
        throw new BiwengerMutationError(safeMessage, undefined, `/offers/${validated.offerId}`);
      }
    },

    /**
     * Rejects an incoming transfer offer on Biwenger.
     */
    async rejectOffer(userId: string, input: unknown): Promise<RejectOfferResult> {
      if (!userId) {
        throw new Error('User ID is required to reject transfer offers');
      }

      const validated = validateRejectOfferInput(input);

      try {
        await executeUserProviderCommand(userId, 'offer.reject', async (client, context) => {
          return client.command(`/offers/${validated.offerId}`, {
            method: 'PUT',
            body: {
              status: 'rejected',
            },
            context,
          });
        });

        return {
          status: 'completed',
          offerId: validated.offerId,
          message: 'Oferta rechazada correctamente',
        };
      } catch (error: unknown) {
        if (
          error instanceof MarketCommandValidationError ||
          error instanceof BiwengerMutationError ||
          error instanceof BiwengerRateLimitError ||
          error instanceof BiwengerAuthError ||
          error instanceof BiwengerNetworkError
        ) {
          throw error;
        }

        const safeMessage = sanitizeErrorMessage(error, 'Biwenger no pudo rechazar la oferta.');
        throw new BiwengerMutationError(safeMessage, undefined, `/offers/${validated.offerId}`);
      }
    },
  };
}

export const marketCommandService: MarketCommandService = createMarketCommandService();
