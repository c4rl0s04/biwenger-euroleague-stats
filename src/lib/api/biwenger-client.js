/**
 * Biwenger API Client (Unofficial) - Compatibility Layer
 * Delegates to the typed, secure provider boundary in src/features/provider/server
 */

import { CONFIG } from '../config.js';
import {
  biwengerProviderClient,
  BiwengerRateLimitError,
  BiwengerAuthError,
  BiwengerProviderError,
  BiwengerMutationError,
} from '../../features/provider/server';

/**
 * Generic fetch wrapper for Biwenger API with Retry Logic and Version Injection
 * @param {string} endpoint - API endpoint (relative to BASE_URL)
 * @param {object} options - Internal options for retries and behaviors
 * @returns {Promise<any>} - JSON response
 */
export async function biwengerFetch(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    retries,
    retryDelay,
    skipVersionCheck = false,
    customToken,
    customUserId,
    cache,
  } = options;

  const context = {
    token: customToken,
    userId: customUserId,
  };

  const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE';

  if (isMutation) {
    const result = await biwengerProviderClient.command(
      endpoint,
      {
        method,
        body,
        skipVersionCheck,
        retries,
        retryDelay,
      },
      context
    );
    return result.raw ?? { success: true, status: result.httpStatus };
  }

  return biwengerProviderClient.query(
    endpoint,
    {
      retries,
      retryDelay,
      skipVersionCheck,
      cache,
    },
    context
  );
}

// --- Specific method exports ---

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

export async function fetchPlayerDetails(playerId) {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.PLAYER_DETAILS(playerId));
}

export async function fetchHome() {
  return biwengerFetch('/home');
}

export async function fetchTournament(tournamentId) {
  return biwengerFetch(`/tournaments/${tournamentId}`);
}

export async function fetchMarketListings() {
  return biwengerFetch(CONFIG.ENDPOINTS.BIWENGER.MARKET(CONFIG.API.LEAGUE_ID));
}
