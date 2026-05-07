'use server';

/**
 * Team Service
 * Business logic layer for team-related operations
 */

import { getTeamDetails } from '../../db/queries/core/teams';
import { getPlayersByTeam } from '../../db/queries/core/players';
import { getTeamUpcomingMatches, getTeamRecentMatches } from '../../db/queries/competition/matches';

/**
 * Get full team profile by ID
 * @param teamId - Team ID
 * @returns Team profile data including roster and matches
 */
export async function fetchTeamProfile(teamId: number | string) {
  const numericId = Number(teamId);

  const [details, roster, upcomingMatches, recentMatches] = await Promise.all([
    getTeamDetails(numericId),
    getPlayersByTeam(numericId),
    getTeamUpcomingMatches(numericId, 3),
    getTeamRecentMatches(numericId, 5),
  ]);

  if (!details) return null;

  return {
    ...details,
    roster,
    upcomingMatches,
    recentMatches,
  };
}
