// This file is shared between Server (Next.js/Scripts) and Client components.
// Be careful with server-only imports (fs, path, dotenv).

// Next.js automatically loads .env vars.
// Standalone scripts must load 'dotenv' BEFORE importing this file.

const API_BASE = 'https://biwenger.as.com/api/v2';

/**
 * Global Application Configuration
 * @constant
 */
export const CONFIG = {
  /**
   * Environment Settings
   */
  ENV: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_DEV: process.env.NODE_ENV === 'development',
    IS_PROD: process.env.NODE_ENV === 'production',
  },

  /**
   * Biwenger API Configuration
   */
  API: {
    BASE_URL: API_BASE,
    TOKEN: process.env.BIWENGER_TOKEN,
    LEAGUE_ID: process.env.BIWENGER_LEAGUE_ID,
    USER_ID: process.env.BIWENGER_USER_ID,
  },

  /**
   * Euroleague Specific Settings
   */
  EUROLEAGUE: {
    SEASON_CODE: process.env.EUROLEAGUE_SEASON_CODE || 'E2025',
    API_V1_URL: 'https://api-live.euroleague.net',
    API_LEGACY_URL: 'https://live.euroleague.net/api',
  },

  /**
   * League Settings
   */
  LEAGUE: {
    START_DATE: process.env.LEAGUE_START_DATE,
  },

  /**
   * Database Configuration
   */
  DB: {
    // Use conditional simple path for client-safety (Client should not use this anyway)
    PATH:
      typeof process !== 'undefined' && process.cwd
        ? `${process.cwd()}/data/local.db`
        : 'data/local.db',
    SKIP: process.env.SKIP_DB === 'true',
  },

  /**
   * Biwenger Position Mappings
   */
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
     * Biwenger API Endpoints (Relative to CONFIG.API.BASE_URL)
     */
    BIWENGER: {
      COMPETITION_DATA: '/competitions/euroleague/data?lang=es',
      LEAGUE_STANDINGS: (leagueId) => `/league/${leagueId}?fields=standings`,
      LEAGUE_BOARD: (leagueId, offset, limit) =>
        `/league/${leagueId}/board?offset=${offset}&limit=${limit}`,
      ROUND_GAMES: (roundId) => `/rounds/euroleague/${roundId}?score=1&v=629`,
      ROUND_LEAGUE: (roundId) =>
        roundId ? `/rounds/league/${roundId}?v=629` : `/rounds/league?v=629`,
      PLAYER_DETAILS: (id) =>
        `/players/euroleague/${id}?lang=es&fields=id,name,position,prices,birthday,height,weight,img`,
      USER_PLAYERS: (id) => `/user/${id}?fields=players`,
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

// Validate required config in Server Environment
if (typeof window === 'undefined') {
  if (!CONFIG.API.TOKEN) console.warn('⚠️ BIWENGER_TOKEN is missing in environment variables');
  if (!CONFIG.API.LEAGUE_ID)
    console.warn('⚠️ BIWENGER_LEAGUE_ID is missing in environment variables');
  if (!CONFIG.API.USER_ID) console.warn('⚠️ BIWENGER_USER_ID is missing in environment variables');
}
