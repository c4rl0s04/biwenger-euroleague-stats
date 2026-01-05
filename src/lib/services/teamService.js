/**
 * Team Service
 * Business logic layer for team-related operations
 */

import { getTeamById } from '../db';

/**
 * Get full team profile by ID
 * @param {number} teamId - Team ID
 * @returns {Object} Team profile data
 */
export function fetchTeamProfile(teamId) {
  return getTeamById(teamId);
}
