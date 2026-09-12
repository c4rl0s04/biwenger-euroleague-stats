import 'server-only';

/**
 * Core Service for User Operations
 * Handles business logic related to users/participants
 */

import {
  getUserSeasonStats,
  getUserSquadDetails,
  getUserRecentRounds,
  getUserTopContributors,
} from '../../db';

/**
 * Fetch all users participating in the league
 * @returns List of users
 */
// Compatibility name for Schedule until its composition migration.
export { getManagerDirectory as fetchAllUsers } from '@/features/managers/server';

export async function fetchUserSeasonStats(userId: string | number) {
  return await getUserSeasonStats(userId);
}

export async function fetchUserSquadDetails(userId: string | number) {
  return await getUserSquadDetails(userId);
}

export async function fetchUserRecentRounds(userId: string | number) {
  return await getUserRecentRounds(String(userId), 100);
}

export async function fetchUserTopContributors(userId: string | number) {
  return await getUserTopContributors(String(userId));
}
