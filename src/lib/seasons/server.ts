import 'server-only';

import { cache } from 'react';
import { listAvailableSeasons, getActiveSeasonId } from '@/lib/seasons';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface SeasonSelectionItem {
  id: string;
  name: string;
  status: 'active' | 'frozen' | 'archived';
  isSyncEnabled: boolean;
  euroleagueCode: string | null;
  startsAt: string | null;
  endsAt: string | null;
  frozenAt: string | null;
}

export interface RequestSeasonContext {
  seasons: SeasonSelectionItem[];
  currentSeasonId: string;
  activeSeasonId: string;
}

// Caller-owned request/selection context; React cache deduplicates only within a request.
// No persistent cache, cookie writes, authentication changes or database records in props.
export const getRequestSeasonContext = cache(async (): Promise<RequestSeasonContext> => {
  const [seasons, currentSeasonId, activeSeasonId] = await Promise.all([
    listAvailableSeasons(),
    resolveReadSeasonId(),
    getActiveSeasonId().catch(() => null),
  ]);
  return {
    seasons: seasons.map((season) => ({
      id: season.id,
      name: season.name,
      status: season.status,
      isSyncEnabled: season.isSyncEnabled,
      euroleagueCode: season.euroleagueCode,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      frozenAt: season.frozenAt?.toISOString() ?? null,
    })),
    currentSeasonId,
    activeSeasonId: activeSeasonId || currentSeasonId,
  };
});
