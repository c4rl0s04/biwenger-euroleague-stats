import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { playerSeasons } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { assertWritableSeason } from '@/lib/seasons';

export interface MarketCommandRepository {
  clearLocalPlayerOwner(playerId: number): Promise<void>;
}

export const marketCommandRepository: MarketCommandRepository = {
  /**
   * Sets player season owner to null after an immediate sale or accepted offer.
   * Ensures write operations only execute against a writable active season.
   */
  async clearLocalPlayerOwner(playerId: number): Promise<void> {
    const seasonId = await resolveReadSeasonId();
    await assertWritableSeason(seasonId);

    await db
      .update(playerSeasons)
      .set({ ownerId: null, updatedAt: new Date() })
      .where(and(eq(playerSeasons.seasonId, seasonId), eq(playerSeasons.playerId, playerId)));
  },
};
