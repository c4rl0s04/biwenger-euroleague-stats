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
   * Withdraws a player from the market (if needed in the future)
   */
  async withdrawFromMarket({ playerId, userId }: { playerId: number; userId: string }) {
    // For withdrawal, Biwenger usually uses a DELETE on the offer ID or a similar POST.
    // We'll implement this if we add a "Remove from Market" button.
  },
};
