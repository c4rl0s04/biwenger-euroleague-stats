// This file is shared between Server (Next.js/Scripts) and Client components.
// Be careful with server-only imports (fs, path, dotenv).

// Next.js automatically loads .env vars.
// Standalone scripts must load 'dotenv' BEFORE importing this file.

const API_BASE = 'https://biwenger.as.com/api/v2';
const HISTORICAL_DEFAULT_SEASON_ID = '2025-26';

/**
 * Resolve the single operational season configuration.
 * The historical default keeps the frozen app readable before the next season is activated.
 * Mutating syncs call validateSeasonConfig() and require every provider value explicitly.
 */
export function getSeasonConfig(env = process.env) {
  const id = env.SEASON_ID?.trim() || HISTORICAL_DEFAULT_SEASON_ID;

  return Object.freeze({
    ID: id,
    NAME: env.SEASON_NAME?.trim() || `EuroLeague Fantasy ${id}`,
    BIWENGER_LEAGUE_ID: env.BIWENGER_LEAGUE_ID?.trim(),
    BIWENGER_USER_ID: env.BIWENGER_USER_ID?.trim(),
    EUROLEAGUE_CODE: env.EUROLEAGUE_SEASON_CODE?.trim(),
    START_DATE: env.LEAGUE_START_DATE?.trim(),
  });
}

export class SeasonConfigError extends Error {
  constructor(errors) {
    super(`Invalid season configuration: ${errors.join('; ')}`);
    this.name = 'SeasonConfigError';
    this.code = 'INVALID_SEASON_CONFIG';
    this.errors = errors;
  }
}

export function validateSeasonConfig(options = {}, env = process.env) {
  const {
    requireBiwenger = true,
    requireEuroleague = true,
    requireStartDate = true,
    requireToken = true,
  } = options;
  const season = getSeasonConfig(env);
  const errors = [];

  if (!env.SEASON_ID?.trim()) errors.push('SEASON_ID is required');
  if (!/^\d{4}-\d{2}$/.test(season.ID)) errors.push('SEASON_ID must use YYYY-YY format');
  if (/^\d{4}-\d{2}$/.test(season.ID)) {
    const startYear = Number(season.ID.slice(0, 4));
    const expectedEnd = String(startYear + 1).slice(-2);
    if (season.ID.slice(-2) !== expectedEnd) {
      errors.push(`SEASON_ID must end in ${expectedEnd} for start year ${startYear}`);
    }
  }

  if (requireBiwenger) {
    if (!season.BIWENGER_LEAGUE_ID) errors.push('BIWENGER_LEAGUE_ID is required');
    if (!season.BIWENGER_USER_ID) errors.push('BIWENGER_USER_ID is required');
    if (season.BIWENGER_LEAGUE_ID && !/^\d+$/.test(season.BIWENGER_LEAGUE_ID)) {
      errors.push('BIWENGER_LEAGUE_ID must be numeric');
    }
    if (season.BIWENGER_USER_ID && !/^\d+$/.test(season.BIWENGER_USER_ID)) {
      errors.push('BIWENGER_USER_ID must be numeric');
    }
  }

  if (requireToken && !env.BIWENGER_TOKEN?.trim()) errors.push('BIWENGER_TOKEN is required');

  if (requireEuroleague && !/^E\d{4}$/.test(season.EUROLEAGUE_CODE || '')) {
    errors.push('EUROLEAGUE_SEASON_CODE must use EYYYY format');
  }

  const seasonStartYear = season.ID.slice(0, 4);
  if (
    requireEuroleague &&
    /^E\d{4}$/.test(season.EUROLEAGUE_CODE || '') &&
    season.EUROLEAGUE_CODE !== `E${seasonStartYear}`
  ) {
    errors.push('EUROLEAGUE_SEASON_CODE must match the SEASON_ID start year');
  }

  if (requireStartDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(season.START_DATE || '')) {
      errors.push('LEAGUE_START_DATE must use YYYY-MM-DD format');
    } else if (Number.isNaN(Date.parse(`${season.START_DATE}T00:00:00Z`))) {
      errors.push('LEAGUE_START_DATE must be a valid date');
    } else if (!season.START_DATE.startsWith(`${seasonStartYear}-`)) {
      errors.push('LEAGUE_START_DATE must fall in the SEASON_ID start year');
    }
  }

  if (errors.length > 0) throw new SeasonConfigError(errors);
  return season;
}

const SEASON_CONFIG = getSeasonConfig();

/**
 * Global Application Configuration
 * @constant
 */
export const CONFIG = {
  SEASON: SEASON_CONFIG,

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
    LEAGUE_ID: SEASON_CONFIG.BIWENGER_LEAGUE_ID,
    USER_ID: SEASON_CONFIG.BIWENGER_USER_ID,
    VERSION_FALLBACK: process.env.BIWENGER_API_VERSION_FALLBACK,
  },

  /**
   * Euroleague Specific Settings
   */
  EUROLEAGUE: {
    SEASON_CODE: SEASON_CONFIG.EUROLEAGUE_CODE,
    API_V1_URL: 'https://api-live.euroleague.net',
    API_LEGACY_URL: 'https://live.euroleague.net/api',
  },

  /**
   * League Settings
   */
  LEAGUE: {
    START_DATE: SEASON_CONFIG.START_DATE,
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

// Validate required config in Server Environment
if (typeof window === 'undefined') {
  if (!CONFIG.API.TOKEN) console.warn('⚠️ BIWENGER_TOKEN is missing in environment variables');
  if (!CONFIG.API.LEAGUE_ID)
    console.warn('⚠️ BIWENGER_LEAGUE_ID is missing in environment variables');
  if (!CONFIG.API.USER_ID) console.warn('⚠️ BIWENGER_USER_ID is missing in environment variables');
}
