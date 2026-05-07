import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { biwengerFetch } from '../api/biwenger-client.js';

/**
 * Service to handle raw Lineup operations
 */
export const lineupService = {
  /**
   * Directly updates the lineup on Biwenger
   * @param params - { lineup, userId }
   */
  async updateLineup({ lineup, userId }: { lineup: any; userId: string }) {
    // 1. Fetch user token from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    // 2. Call Biwenger API with the custom token
    // Lineup updates are PATCH requests to /user, with the payload wrapped in a 'lineup' key
    return await biwengerFetch('/user', {
      method: 'PUT',
      body: { lineup },
      customToken: user.biwengerToken,
      customUserId: userId,
    });
  },

  /**
   * Fetches the current lineup configuration from Biwenger
   */
  async getLineup(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });

    if (!user || !user.biwengerToken) {
      throw new Error(`No se encontró un token de Biwenger configurado para el usuario ${userId}`);
    }

    const fields =
      '*,lineup(type,playersID,reservesID,captain,striker,coach,date),players(id,owner)';
    const userData = await biwengerFetch(`/user?fields=${fields}`, {
      customToken: user.biwengerToken,
      customUserId: userId,
      cache: 'no-store',
    });

    return userData.data;
  },
};
