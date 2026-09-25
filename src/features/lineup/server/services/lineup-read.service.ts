import 'server-only';

import { executeUserProviderQuery } from '@/features/provider/server';
import type { SafeLineupResponse } from '../../models/lineup';
import { mapToSafeLineupResponse } from '../mappers/lineup-read.mapper';

export const LINEUP_READ_FIELDS =
  '*,lineup(type,playersID,reservesID,captain,striker,coach,date),players(id,owner),market,offers,-trophies';

export interface LineupReadService {
  getLineup(userId: string): Promise<SafeLineupResponse>;
}

export const lineupReadService: LineupReadService = {
  /**
   * Fetches the current user lineup, squad ownership, market listings, and pending offers
   * from Biwenger using the user's encrypted personal credentials.
   *
   * Enforces a private 'no-store' policy and returns a fully sanitized SafeLineupResponse.
   */
  async getLineup(userId: string): Promise<SafeLineupResponse> {
    if (!userId) {
      throw new Error('User ID is required to fetch lineup');
    }

    return executeUserProviderQuery(userId, 'lineup.read', async (client, context) => {
      const response = await client.query<{ data?: unknown; [key: string]: unknown }>(
        `/user?fields=${LINEUP_READ_FIELDS}`,
        {
          context,
          cache: 'no-store',
        }
      );

      const payload = response?.data ?? response;
      return mapToSafeLineupResponse(payload);
    });
  },
};
