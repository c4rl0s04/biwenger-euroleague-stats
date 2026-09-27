'use client';

import { createContext, useContext } from 'react';

/**
 * Client-safe season selection contract. Server season resolution remains in lib/seasons.
 * @typedef {{id: string, name?: string, active?: boolean}} SeasonItem
 * @typedef {{seasons?: SeasonItem[], currentSeasonId?: string, activeSeasonId?: string}} SeasonSelection
 * @typedef {SeasonSelection & {children: import('react').ReactNode}} SeasonProviderProps
 * @typedef {{seasons: SeasonItem[], currentSeasonId?: string, activeSeasonId?: string, currentSeason: SeasonItem | null, isCustomSeason: boolean, selectSeason: (seasonId?: string) => void}} SeasonContextValue
 */
const SeasonContext = createContext(/** @type {SeasonContextValue | null} */ (null));

/** @param {SeasonProviderProps} props */
export function SeasonProvider({ children, seasons = [], currentSeasonId, activeSeasonId }) {
  const isCustomSeason = Boolean(
    currentSeasonId && activeSeasonId && currentSeasonId !== activeSeasonId
  );

  const selectSeason = (seasonId) => {
    if (!seasonId) return;

    if (seasonId === activeSeasonId) {
      // Clear cookie to resume live dynamic following
      document.cookie = 'NEXT_SEASON_ID=; path=/; max-age=0; SameSite=Lax';
    } else {
      // Set cookie for 1 year
      document.cookie = `NEXT_SEASON_ID=${seasonId}; path=/; max-age=31536000; SameSite=Lax`;
    }

    window.location.reload();
  };

  const currentSeason = seasons.find((s) => s.id === currentSeasonId) || null;

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        currentSeasonId,
        activeSeasonId,
        currentSeason,
        isCustomSeason,
        selectSeason,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
