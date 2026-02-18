import 'server-only';

/**
 * Team Service
 * Business logic layer for team-related operations
 */

import { getTeamById } from '../../db';

/**
 * Get full team profile by ID
 * @param {number} teamId - Team ID
 * @returns {Promise<Object>} Team profile data
 */
export async function fetchTeamProfile(teamId) {
  return await getTeamById(teamId);
}
