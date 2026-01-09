/**
 * Biwenger API Client (Unofficial)
 */

import { CONFIG } from '../config.js';

// Auxiliary wait function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get random delay between min and max ms
const getRandomDelay = (min = 2000, max = 5000) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Generic fetch wrapper for Biwenger API with Retry Logic
 * @param {string} endpoint - API endpoint (relative to BASE_URL)
 * @param {object} options - Internal options for retries
 * @returns {Promise<any>} - JSON response
 */
export async function biwengerFetch(endpoint, options = {}) {
  const tokenRaw = CONFIG.API.TOKEN;
  const leagueId = CONFIG.API.LEAGUE_ID;
  const userId = CONFIG.API.USER_ID;

  // Default retry configuration
  const { retries = 3, retryDelay = 5000 } = options;

  if (!tokenRaw) throw new Error('BIWENGER_TOKEN is missing');
  if (!leagueId) throw new Error('BIWENGER_LEAGUE_ID is missing');

  const url = `${CONFIG.API.BASE_URL}${endpoint}`;
  const token = tokenRaw.startsWith('Bearer ') ? tokenRaw : `Bearer ${tokenRaw}`;

  const headers = {
    Authorization: token,
    'X-League': leagueId,
    'X-User': userId,
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // RANDOM DELAY: Safety measure against bans (2-5 seconds random)
  const safeDelay = getRandomDelay(2000, 5000);
  console.log(`Fetching: ${url} (Wait: ${safeDelay}ms)`);
  await sleep(safeDelay);

  try {
    const response = await fetch(url, { headers });

    // --- RETRY LOGIC FOR 429 ---
    if (response.status === 429) {
      if (retries > 0) {
        console.warn(`⚠️ Rate Limit (429). Pausing ${retryDelay}ms before retrying...`);
        await sleep(retryDelay);
        // Recursive call: 1 less attempt, double wait time (Exponential Backoff)
        return biwengerFetch(endpoint, {
          ...options,
          retries: retries - 1,
          retryDelay: retryDelay * 2,
        });
      } else {
        throw new Error(`Biwenger API Error: 429 Too Many Requests (Max retries exceeded)`);
      }
    }
    // ------------------------------------

    if (!response.ok) {
      throw new Error(`Biwenger API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Avoid logging error if it's an internal retry, unless it's the final one
    if (retries === 0 || !error.message.includes('429')) {
      console.error(`Failed to fetch ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// --- Specific method exports (Same as before) ---

export async function fetchMarket() {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(CONFIG.API.LEAGUE_ID, 0, 100));
}

export async function fetchLeague() {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_STANDINGS(CONFIG.API.LEAGUE_ID));
}

export async function fetchTransfers(offset = 0, limit = 20) {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(CONFIG.API.LEAGUE_ID, offset, limit));
}

export async function fetchCompetition() {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.COMPETITION_DATA);
}

export async function fetchAllPlayers() {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.COMPETITION_DATA);
}

export async function fetchRoundsLeague(roundId) {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.ROUND_LEAGUE(roundId));
}

export async function fetchRoundGames(roundId) {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.ROUND_GAMES(roundId));
}

// This is the new function you added
export async function fetchPlayerDetails(playerId) {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.PLAYER_DETAILS(playerId));
}
