import 'server-only';

/**
 * Team Service
 * Business logic layer for team-related operations
 */

import { getTeamById } from '../../db';

/**
 * Get full team profile by ID
 * @param teamId - Team ID
 * @returns Team profile data
 */
export async function fetchTeamProfile(teamId: number | string) {
  return await getTeamById(teamId);
}
