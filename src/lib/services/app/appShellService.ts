import 'server-only';

import { cache } from 'react';

import { getExtendedStandings } from '@/lib/db/queries/competition/standings';
import { listAvailableSeasons, getActiveSeasonId } from '@/lib/seasons';
import { resolveReadSeasonId } from '@/lib/db/season-context';

/** Deduplicates the standings read when the app shell and a screen need it in one request. */
export const getAppStandings = cache(async () => getExtendedStandings());

export const getAppSeasonContext = cache(async () => {
  const [seasons, currentSeasonId, activeSeasonId] = await Promise.all([
    listAvailableSeasons(),
    resolveReadSeasonId(),
    getActiveSeasonId().catch(() => null),
  ]);

  return {
    seasons,
    currentSeasonId,
    activeSeasonId: activeSeasonId || currentSeasonId,
  };
});
