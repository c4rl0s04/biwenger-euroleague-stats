import 'server-only';

/**
 * Core Service for User Operations
 * Handles business logic related to users/participants
 */

import {
  getAllUsers,
  getUserSeasonStats,
  getUserSquadDetails,
  getUserRecentRounds,
} from '../../db';

/**
 * Fetch all users participating in the league
 * @returns List of users
 */
export async function fetchAllUsers() {
  return await getAllUsers();
}

export async function fetchUserSeasonStats(userId: string | number) {
  return await getUserSeasonStats(userId);
}

export async function fetchUserSquadDetails(userId: string | number) {
  return await getUserSquadDetails(userId);
}

export async function fetchUserRecentRounds(userId: string | number) {
  return await getUserRecentRounds(String(userId));
}
