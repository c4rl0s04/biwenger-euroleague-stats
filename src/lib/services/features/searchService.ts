import 'server-only';

/**
 * Feature Service for Search Operations
 */

import { globalSearch } from '../../db';

/**
 * Perform a global search across players, teams, and users
 * @param query - Search term
 * @returns Search results
 */
export async function performGlobalSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { players: [], teams: [], users: [] };
  }
  return await globalSearch(query);
}
