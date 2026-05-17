import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { biwengerFetch } from '../api/biwenger-client.js';

/**
 * Service to handle Market Write operations on Biwenger
 */
export const marketActionsService = {
  /**
   * Places a player on the market
   * @param params - { playerId, price, userId }
   */
  async placeOnMarket({
    playerId,
    price,
    userId,
  }: {
    playerId: number;
    price: number;
    userId: string;
  }) {
    // 1. Fetch user token from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // 2. Call Biwenger API
    // Payload format: {type: "sell", player: ID, price: Value}
    return await biwengerFetch('/market', {
      method: 'POST',
      body: {
        type: 'sell',
        player: playerId,
        price: price,
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });
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
    // 1. Fetch user token from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // 2. Call Biwenger API native team sell
    // Payload format: {type: "team", price: 100}
    return await biwengerFetch('/market', {
      method: 'POST',
      body: {
        type: 'team',
        price: pricePercentage,
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });
  },

  /**
   * Withdraws a player from the market
   */
  async withdrawFromMarket({ playerId, userId }: { playerId: number; userId: string }) {
    // 1. Fetch user token from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // 2. Call Biwenger API
    // DELETE https://biwenger.as.com/api/v2/market?player=ID
    return await biwengerFetch(`/market?player=${playerId}`, {
      method: 'DELETE',
      customToken: user.biwengerToken,
      customUserId: userId,
    });
  },

  /**
   * Accepts a transfer offer
   */
  async acceptOffer({ offerId, userId }: { offerId: number; userId: string }) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // Correct Biwenger endpoint for accepting: PUT /offers/:id
    // Payload: { status: "accepted" }
    return await biwengerFetch(`/offers/${offerId}`, {
      method: 'PUT',
      body: {
        status: 'accepted',
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });
  },

  /**
   * Rejects a transfer offer
   */
  async rejectOffer({ offerId, userId }: { offerId: number; userId: string }) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // Correct Biwenger endpoint for rejecting: PUT /offers/:id
    // Payload: { status: "rejected" }
    return await biwengerFetch(`/offers/${offerId}`, {
      method: 'PUT',
      body: {
        status: 'rejected',
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });
  },
};
