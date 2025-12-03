import path from 'path';
import dotenv from 'dotenv';

// Ensure env vars are loaded if this file is imported directly
dotenv.config({ path: '.env.local' });

export const CONFIG = {
  API: {
    BASE_URL: 'https://biwenger.as.com/api/v2',
    TOKEN: process.env.BIWENGER_TOKEN,
    LEAGUE_ID: process.env.BIWENGER_LEAGUE_ID,
    USER_ID: process.env.BIWENGER_USER_ID,
  },
  DB: {
    PATH: path.join(process.cwd(), 'data', 'local.db'),
  },
  POSITIONS: {
    1: 'Base',
    2: 'Alero',
    3: 'Pivot',
    4: 'Entrenador',
    5: 'Entrenador'
  },
  ENDPOINTS: {
    COMPETITION_DATA: '/competitions/euroleague/data?lang=es',
    LEAGUE_STANDINGS: (leagueId) => `/league/${leagueId}?fields=standings`,
    LEAGUE_BOARD: (leagueId, offset, limit) => `/league/${leagueId}/board?offset=${offset}&limit=${limit}`,
    ROUND_GAMES: (roundId) => `/rounds/euroleague/${roundId}?score=1&v=629`,
    ROUND_LEAGUE: (roundId) => roundId ? `/rounds/league/${roundId}?v=629` : `/rounds/league?v=629`
  }
};

// Validate required config
if (!CONFIG.API.TOKEN) console.warn('⚠️ BIWENGER_TOKEN is missing in .env.local');
if (!CONFIG.API.LEAGUE_ID) console.warn('⚠️ BIWENGER_LEAGUE_ID is missing in .env.local');
