/**
 * Biwenger API Client (Unofficial) - Compatibility Layer
 * Delegates to the typed, secure provider boundary in src/features/provider/server
 */

import { CONFIG } from '../config.js';
import { biwengerProviderClient } from '../../features/provider/server';

/**
 * Generic fetch wrapper for Biwenger API with Retry Logic and Version Injection
 * @param {string} endpoint - API endpoint (relative to BASE_URL)
 * @param {object} options - Internal options for retries and behaviors
 * @returns {Promise<any>} - JSON response
 */
export async function biwengerFetch(endpoint, options = {}, providerContext = {}) {
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
    ...providerContext,
    token: customToken || providerContext.token,
    userId: customUserId || providerContext.userId,
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

export function createBiwengerApi(context) {
  const fetch = (endpoint, options) => biwengerFetch(endpoint, options, context);
  const leagueId = context?.leagueId;
  return {
    fetch,
    fetchMarket: () => fetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, 0, 100)),
    fetchLeague: () => fetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_STANDINGS(leagueId)),
    fetchTransfers: (offset = 0, limit = 20) =>
      fetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, offset, limit)),
    fetchCompetition: () => fetch(CONFIG.ENDPOINTS.BIWENGER.COMPETITION_DATA),
    fetchAllPlayers: () => fetch(CONFIG.ENDPOINTS.BIWENGER.COMPETITION_DATA),
    fetchRoundsLeague: (roundId) => fetch(CONFIG.ENDPOINTS.BIWENGER.ROUND_LEAGUE(roundId)),
    fetchRoundGames: (roundId) => fetch(CONFIG.ENDPOINTS.BIWENGER.ROUND_GAMES(roundId)),
    fetchPlayerDetails: (playerId) => fetch(CONFIG.ENDPOINTS.BIWENGER.PLAYER_DETAILS(playerId)),
    fetchHome: () => fetch('/home'),
    fetchTournament: (id) => fetch(`/tournaments/${id}`),
    fetchMarketListings: () => fetch('/market'),
  };
}
