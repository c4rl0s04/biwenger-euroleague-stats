import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { playerSeasons } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { assertWritableSeason } from '@/lib/seasons';

const rowVersion = sql<string>`xmin::text`;

export interface MarketCommandRepository {
  capturePlayerOwnership(
    playerId: number,
    ownerId: string
  ): Promise<{
    seasonId: string;
    version: string;
  } | null>;
  clearConfirmedPlayerOwner(
    playerId: number,
    ownerId: string,
    snapshot: { seasonId: string; version: string }
  ): Promise<boolean>;
  clearLocalPlayerOwner(playerId: number, ownerId: string): Promise<void>;
}

export const marketCommandRepository: MarketCommandRepository = {
  async capturePlayerOwnership(playerId, ownerId) {
    const seasonId = await resolveReadSeasonId();
    const [row] = await db
      .select({ version: rowVersion })
      .from(playerSeasons)
      .where(
        and(
          eq(playerSeasons.seasonId, seasonId),
          eq(playerSeasons.playerId, playerId),
          eq(playerSeasons.ownerId, ownerId)
        )
      );
    return row ? { seasonId, version: row.version } : null;
  },

  async clearConfirmedPlayerOwner(playerId, ownerId, { seasonId, version }) {
    await assertWritableSeason(seasonId);
    const [row] = await db
      .update(playerSeasons)
      .set({ ownerId: null, updatedAt: new Date() })
      .where(
        and(
          eq(playerSeasons.seasonId, seasonId),
          eq(playerSeasons.playerId, playerId),
          eq(playerSeasons.ownerId, ownerId),
          eq(rowVersion, version)
        )
      )
      .returning({ playerId: playerSeasons.playerId });
    return Boolean(row);
  },

  /**
   * Clears ownership only while the acting manager still owns the player.
   * Ensures write operations only execute against a writable active season.
   */
  async clearLocalPlayerOwner(playerId: number, ownerId: string): Promise<void> {
    const seasonId = await resolveReadSeasonId();
    await assertWritableSeason(seasonId);

    await db
      .update(playerSeasons)
      .set({ ownerId: null, updatedAt: new Date() })
      .where(
        and(
          eq(playerSeasons.seasonId, seasonId),
          eq(playerSeasons.playerId, playerId),
          eq(playerSeasons.ownerId, ownerId)
        )
      );
  },
};
