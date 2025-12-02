/**
 * Biwenger API Client (Unofficial)
 * 
 * This client interacts with the Biwenger API to fetch data for the application.
 * Since this is an unofficial API, we need to be careful with headers and rate limiting.
 * 
 * REQUIRED CONFIGURATION:
 * You must provide the following environment variables or hardcoded values:
 * - BIWENGER_TOKEN: The Bearer token (found in Authorization header)
 * - BIWENGER_LEAGUE_ID: The ID of your league (found in X-League header or URL)
 * - BIWENGER_ACCOUNT_ID: (Optional) Sometimes required in headers
 */

import { CONFIG } from './config.js';

/**
 * Generic fetch wrapper for Biwenger API
 * @param {string} endpoint - API endpoint (relative to BASE_URL)
 * @returns {Promise<any>} - JSON response
 */
export async function biwengerFetch(endpoint) {
  const tokenRaw = CONFIG.API.TOKEN;
  const leagueId = CONFIG.API.LEAGUE_ID;
  const userId = CONFIG.API.USER_ID;

  if (!tokenRaw) {
    throw new Error('BIWENGER_TOKEN is missing in environment variables');
  }
  if (!leagueId) {
    throw new Error('BIWENGER_LEAGUE_ID is missing in environment variables');
  }

  const url = `${CONFIG.API.BASE_URL}${endpoint}`;
  
  // Handle token prefix
  const token = tokenRaw.startsWith('Bearer ') ? tokenRaw : `Bearer ${tokenRaw}`;

  const headers = {
    'Authorization': token,
    'X-League': leagueId,
    'X-User': userId,
    'Accept': 'application/json, text/plain, */*'
  };
  console.log(`Fetching: ${url}`);
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Biwenger API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Fetch market data (active sales)
 */
export async function fetchMarket() {
  return biwengerFetch(CONFIG.ENDPOINTS.LEAGUE_BOARD(CONFIG.API.LEAGUE_ID, 0, 100));
}

/**
 * Fetch league standings and users
 */
export async function fetchLeague() {
  return biwengerFetch(CONFIG.ENDPOINTS.LEAGUE_STANDINGS(CONFIG.API.LEAGUE_ID));
}

/**
 * Fetch board/transfers history
 */
export async function fetchTransfers(offset = 0, limit = 20) {
  return biwengerFetch(CONFIG.ENDPOINTS.LEAGUE_BOARD(CONFIG.API.LEAGUE_ID, offset, limit));
}

/**
 * Fetch competition data (players, teams, rounds)
 */
export async function fetchCompetition() {
  return biwengerFetch(CONFIG.ENDPOINTS.COMPETITION_DATA);
}

/**
 * Fetch all players (alias for fetchCompetition)
 */
export async function fetchAllPlayers() {
  return biwengerFetch(CONFIG.ENDPOINTS.COMPETITION_DATA); 
}

/**
 * Fetch rounds list or specific round details (lineups)
 */
export async function fetchRoundsLeague(roundId) {
  return biwengerFetch(CONFIG.ENDPOINTS.ROUND_LEAGUE(roundId));
}

/**
 * Fetch games/matches for a specific round
 */
export async function fetchRoundGames(roundId) {
  // Fetch with score=1 to get standard fantasy points
  // Remove lang=es to match user expectations (English API seems closer to user's 27 points)
  return biwengerFetch(`/rounds/euroleague/${roundId}?score=1`);
}
