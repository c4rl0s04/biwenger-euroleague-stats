// Shared provider and basketball constants; no environment values or secrets.
export const CONFIG = {
  POSITIONS: {
    1: 'Base',
    2: 'Alero',
    3: 'Pivot',
    4: 'Entrenador',
    5: 'Entrenador',
  },

  /**
   * Application Endpoints
   * Grouped by Provider/Source
   */
  ENDPOINTS: {
    /**
     * Biwenger API Endpoints (Relative to the provider base URL)
     */
    BIWENGER: {
      COMPETITION_DATA: '/competitions/euroleague/data?lang=es',
      LEAGUE_STANDINGS: (leagueId) => `/league/${leagueId}?fields=standings`,
      LEAGUE_BOARD: (leagueId, offset, limit) =>
        `/league/${leagueId}/board?offset=${offset}&limit=${limit}`,
      ROUND_GAMES: (roundId) => `/rounds/euroleague/${roundId}?score=1`,
      ROUND_LEAGUE: (roundId) => (roundId ? `/rounds/league/${roundId}` : `/rounds/league`),
      PLAYER_DETAILS: (id) =>
        `/players/euroleague/${id}?lang=es&fields=id,name,position,prices,birthday,height,weight,img`,
      USER_PLAYERS: (id) => `/user/${id}?fields=players`,
      MARKET: (leagueId) => `/market`,
    },

    /**
     * Euroleague Official Website (Scrapers/External Links)
     */
    EUROLEAGUE_WEBSITE: {
      OFFICIAL_TEAM_PROFILE: (slug, code) =>
        `https://www.euroleaguebasketball.net/euroleague/teams/${slug}/${code}/`,
      OFFICIAL_PLAYER_PROFILE: (slug, paddedId) =>
        `https://www.euroleaguebasketball.net/euroleague/players/${slug}/${paddedId}/`,
    },
  },

  // User colors are now handled in the database (users table)
};
