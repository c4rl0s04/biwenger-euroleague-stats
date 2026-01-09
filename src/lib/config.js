// This file is shared between Server (Next.js/Scripts) and Client components.
// Be careful with server-only imports (fs, path, dotenv).

// Next.js automatically loads .env vars.
// Standalone scripts must load 'dotenv' BEFORE importing this file.

const API_BASE = 'https://biwenger.as.com/api/v2';

export const CONFIG = {
  API: {
    BASE_URL: 'https://biwenger.as.com/api/v2',
    TOKEN: process.env.BIWENGER_TOKEN,
    LEAGUE_ID: process.env.BIWENGER_LEAGUE_ID,
    USER_ID: process.env.BIWENGER_USER_ID,
  },
  EUROLEAGUE: {
    SEASON_CODE: 'E2025',
    API_V1_URL: 'https://api-live.euroleague.net',
    API_LEGACY_URL: 'https://live.euroleague.net/api',
  },
  LEAGUE: {
    START_DATE: '2025-09-25',
  },
  DB: {
    // Use conditional simple path for client-safety (Client should not use this anyway)
    PATH:
      typeof process !== 'undefined' && process.cwd
        ? `${process.cwd()}/data/local.db`
        : 'data/local.db',
  },
  POSITIONS: {
    1: 'Base',
    2: 'Alero',
    3: 'Pivot',
    4: 'Entrenador',
    5: 'Entrenador',
  },
  ENDPOINTS: {
    COMPETITION_DATA: '/competitions/euroleague/data?lang=es',
    LEAGUE_STANDINGS: (leagueId) => `/league/${leagueId}?fields=standings`,
    LEAGUE_BOARD: (leagueId, offset, limit) =>
      `/league/${leagueId}/board?offset=${offset}&limit=${limit}`,
    ROUND_GAMES: (roundId) => `/rounds/euroleague/${roundId}?score=1&v=629`,
    ROUND_LEAGUE: (roundId) =>
      roundId ? `/rounds/league/${roundId}?v=629` : `/rounds/league?v=629`,
    PLAYER_DETAILS: (id) =>
      `/players/euroleague/${id}?lang=es&fields=prices,birthday,height,weight,img`,
    USER_PLAYERS: (id) => `/user/${id}?fields=players`,
    // Official Website Scrapers
    OFFICIAL_TEAM_PROFILE: (slug, code) =>
      `https://www.euroleaguebasketball.net/euroleague/teams/${slug}/${code}/`,
    OFFICIAL_PLAYER_PROFILE: (slug, paddedId) =>
      `https://www.euroleaguebasketball.net/euroleague/players/${slug}/${paddedId}/`,
  },
  USER_COLORS: {
    FIXED_INDEXES: {
      13207868: 0, // All Stars -> Blue
      13207910: 1, // June -> Purple
      13207924: 2, // ask72 -> Emerald
      13207974: 3, // Nonameyet -> Pink
      13208192: 4, // Real Madrid Basket -> Cyan
      13208960: 5, // Cactus Team -> Orange
      13209320: 6, // Daniel De Castro -> Yellow
    },
  },
};

// Validate required config
if (!CONFIG.API.TOKEN) console.warn('⚠️ BIWENGER_TOKEN is missing in environment variables');
if (!CONFIG.API.LEAGUE_ID)
  console.warn('⚠️ BIWENGER_LEAGUE_ID is missing in environment variables');
if (!CONFIG.API.USER_ID) console.warn('⚠️ BIWENGER_USER_ID is missing in environment variables');
