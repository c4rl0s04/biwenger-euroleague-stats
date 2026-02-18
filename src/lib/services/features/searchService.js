import 'server-only';

/**
 * Feature Service for Search Operations
 */

import { globalSearch } from '../../db';

/**
 * Perform a global search across players, teams, and users
 * @param {string} query - Search term
 * @returns {Promise<Object>} Search results
 */
export async function performGlobalSearch(query) {
  if (!query || query.trim().length < 2) {
    return { players: [], teams: [], users: [] };
  }
  return await globalSearch(query);
}
