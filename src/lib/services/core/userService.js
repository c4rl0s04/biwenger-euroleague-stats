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
 * @returns {Promise<Array>} List of users
 */
export async function fetchAllUsers() {
  return await getAllUsers();
}

export async function fetchUserSeasonStats(userId) {
  return await getUserSeasonStats(userId);
}

export async function fetchUserSquadDetails(userId) {
  return await getUserSquadDetails(userId);
}

export async function fetchUserRecentRounds(userId) {
  return await getUserRecentRounds(userId);
}
