import { biwengerFetch } from '../api/biwenger-client.js';
import { createSafeLineupResponse } from './lineupResponse';
import { assertProviderMutationSucceeded } from './providerMutationResult';
import { biwengerCredentials } from '../credentials/service';

/**
 * Service to handle raw Lineup operations
 */
export const lineupService = {
  /**
   * Directly updates the lineup on Biwenger
   * @param params - { lineup, userId }
   */
  async updateLineup({ lineup, userId }: { lineup: any; userId: string }) {
    const result = await biwengerCredentials.withCredential(userId, 'lineup.update', (credential) =>
      biwengerFetch('/user', {
        method: 'PUT',
        body: { lineup },
        customToken: credential,
        customUserId: userId,
      })
    );

    assertProviderMutationSucceeded(result);
    return { status: 'completed' as const };
  },

  /**
   * Fetches the current lineup configuration from Biwenger
   */
  async getLineup(userId: string) {
    const fields =
      '*,lineup(type,playersID,reservesID,captain,striker,coach,date),players(id,owner),market,offers,-trophies';
    const userData = await biwengerCredentials.withCredential(userId, 'lineup.read', (credential) =>
      biwengerFetch(`/user?fields=${fields}`, {
        customToken: credential,
        customUserId: userId,
        cache: 'no-store',
      })
    );

    return createSafeLineupResponse(userData.data);
  },
};
