import { db } from '../db';
import { users, players } from '../db/schema';
import { eq } from 'drizzle-orm';
import { biwengerFetch } from '../api/biwenger-client.js';

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
    // 1. Fetch user token from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // 2. Call Biwenger API
    // Payload format: {type: "sell" | "immediateSell", player: ID, price: Value}
    const result = await biwengerFetch('/market', {
      method: 'POST',
      body: {
        type: type,
        player: playerId,
        price: price,
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });

    // Check if the sell was successful on Biwenger.
    // If it was, and the type is 'immediateSell', set ownerId to null!
    const hasErrorStatus = result && result.status && (result.status < 200 || result.status >= 300);
    if (result && !hasErrorStatus && !result.error && type === 'immediateSell') {
      try {
        await db.update(players).set({ ownerId: null }).where(eq(players.id, playerId));
        console.log(`[DB] Successfully set player ${playerId} owner to null after immediateSell`);
      } catch (dbErr) {
        console.error('Failed to update player owner in DB after immediate sell:', dbErr);
      }
    }

    return result;
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
  async acceptOffer({
    offerId,
    userId,
    playerId,
  }: {
    offerId: number;
    userId: string;
    playerId?: number;
  }) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // Correct Biwenger endpoint for accepting: PUT /offers/:id
    // Payload: { status: "accepted" }
    const result = await biwengerFetch(`/offers/${offerId}`, {
      method: 'PUT',
      body: {
        status: 'accepted',
      },
      customToken: user.biwengerToken,
      customUserId: userId,
    });

    // Check if the accept was successful on Biwenger.
    // If it was, and playerId is provided, set ownerId to null!
    const hasErrorStatus = result && result.status && (result.status < 200 || result.status >= 300);
    if (result && !hasErrorStatus && !result.error && playerId) {
      try {
        await db.update(players).set({ ownerId: null }).where(eq(players.id, playerId));
        console.log(`[DB] Successfully set player ${playerId} owner to null after accepting offer`);
      } catch (dbErr) {
        console.error('Failed to update player owner in DB after offer acceptance:', dbErr);
      }
    }

    return result;
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
