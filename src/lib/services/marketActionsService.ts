import { db } from '../db';
import { DEFAULT_SEASON_ID, playerSeasons, players } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { biwengerFetch } from '../api/biwenger-client.js';
import { resolveReadSeasonId } from '../db/season-context';
import { assertWritableSeason } from '../seasons';
import { assertProviderMutationSucceeded } from './providerMutationResult';
import { biwengerCredentials } from '../credentials/service';

async function clearLocalPlayerOwner(playerId: number) {
  const seasonId = await resolveReadSeasonId();
  await assertWritableSeason(seasonId);

  await db
    .update(playerSeasons)
    .set({ ownerId: null, updatedAt: new Date() })
    .where(and(eq(playerSeasons.seasonId, seasonId), eq(playerSeasons.playerId, playerId)));

  if (seasonId === DEFAULT_SEASON_ID) {
    await db.update(players).set({ ownerId: null }).where(eq(players.id, playerId));
  }
}

/**
 * Service to handle Market Write operations on Biwenger
 */
export const marketActionsService = {
  /**
   * Places a player on the market or sells them immediately
   * @param params - { playerId, price, userId, type }
   */
  async placeOnMarket({
    playerId,
    price,
    userId,
    type = 'sell',
  }: {
    playerId: number;
    price: number;
    userId: string;
    type?: 'sell' | 'immediateSell';
  }) {
    const result = await biwengerCredentials.withCredential(userId, 'market.place', (credential) =>
      biwengerFetch('/market', {
        method: 'POST',
        body: {
          type,
          player: playerId,
          price,
        },
        customToken: credential,
        customUserId: userId,
      })
    );

    // Check if the sell was successful on Biwenger.
    // If it was, and the type is 'immediateSell', set ownerId to null!
    assertProviderMutationSucceeded(result);

    if (type === 'immediateSell') {
      try {
        await clearLocalPlayerOwner(playerId);
        console.log(
          `[DB] Successfully set player ${playerId} season owner to null after immediateSell`
        );
      } catch (dbErr) {
        console.error('Failed to update player owner in DB after immediate sell:', dbErr);
      }
    }

    return { status: 'completed' as const, playerId, mode: type };
  },

  /**
   * Places all team players on the market at a given percentage of their value
   * @param params - { pricePercentage, userId }
   */
  async placeAllOnMarket({
    pricePercentage = 100,
    userId,
  }: {
    pricePercentage?: number;
    userId: string;
  }) {
    const result = await biwengerCredentials.withCredential(
      userId,
      'market.place-team',
      (credential) =>
        biwengerFetch('/market', {
          method: 'POST',
          body: {
            type: 'team',
            price: pricePercentage,
          },
          customToken: credential,
          customUserId: userId,
        })
    );

    assertProviderMutationSucceeded(result);
    return { status: 'completed' as const };
  },

  /**
   * Withdraws a player from the market
   */
  async withdrawFromMarket({ playerId, userId }: { playerId: number; userId: string }) {
    const result = await biwengerCredentials.withCredential(
      userId,
      'market.withdraw',
      (credential) =>
        biwengerFetch(`/market?player=${playerId}`, {
          method: 'DELETE',
          customToken: credential,
          customUserId: userId,
        })
    );

    assertProviderMutationSucceeded(result);
    return { status: 'completed' as const, playerId };
  },

  /**
   * Accepts a transfer offer
   */
  async acceptOffer({
    offerId,
    userId,
    playerId,
  }: {
    offerId: number;
    userId: string;
    playerId?: number;
  }) {
    const result = await biwengerCredentials.withCredential(userId, 'offer.accept', (credential) =>
      biwengerFetch(`/offers/${offerId}`, {
        method: 'PUT',
        body: {
          status: 'accepted',
        },
        customToken: credential,
        customUserId: userId,
      })
    );

    // Check if the accept was successful on Biwenger.
    // If it was, and playerId is provided, set ownerId to null!
    assertProviderMutationSucceeded(result);

    if (playerId) {
      try {
        await clearLocalPlayerOwner(playerId);
        console.log(
          `[DB] Successfully set player ${playerId} season owner to null after accepting offer`
        );
      } catch (dbErr) {
        console.error('Failed to update player owner in DB after offer acceptance:', dbErr);
      }
    }

    return { status: 'completed' as const, offerId, ...(playerId ? { playerId } : {}) };
  },

  /**
   * Rejects a transfer offer
   */
  async rejectOffer({ offerId, userId }: { offerId: number; userId: string }) {
    const result = await biwengerCredentials.withCredential(userId, 'offer.reject', (credential) =>
      biwengerFetch(`/offers/${offerId}`, {
        method: 'PUT',
        body: {
          status: 'rejected',
        },
        customToken: credential,
        customUserId: userId,
      })
    );

    assertProviderMutationSucceeded(result);
    return { status: 'completed' as const, offerId };
  },
};
