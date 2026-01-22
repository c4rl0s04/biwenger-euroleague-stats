/**
 * Rounds Service
 * Handles business logic for rounds, lineups, and round navigation.
 */

import {
  getAllRounds,
  getUserLineup,
  getNextRound,
  getLastCompletedRound,
  hasOfficialStats,
  getOfficialStandings,
  getLivingStandings,
} from '../db/queries/rounds.js';
import { getAllUsers } from '../db/queries/users.js';

/**
 * Fetch standings for a specific round with fallback logic
 * 1. Try to get OFFICIAL standings (user_rounds) if available.
 * 2. If not, calculate LIVE standings from lineups + player stats.
 * 
 * @param {string} roundId 
 * @returns {Promise<Array>}
 */
export async function fetchRoundStandings(roundId) {
    if (!roundId) return [];
    
    // Check if official stats exist
    const isOfficial = await hasOfficialStats(roundId);
    
    if (isOfficial) {
        return await getOfficialStandings(roundId);
    } else {
        return await getLivingStandings(roundId);
    }
}

/**
 * Fetch all necessary data for the Rounds list/selector
 * @returns {Promise<Object>} { rounds, users, defaultRoundId }
 */
export async function fetchRoundsList() {
  const [rounds, users, lastCompleted] = await Promise.all([
    getAllRounds(),
    getAllUsers(),
    getLastCompletedRound(),
  ]);

  // Determine default round
  // Use explicit last completed round, or fallback to latest round if none found
  const defaultRoundId = lastCompleted?.round_id || rounds[0]?.round_id;

  return {
    rounds,
    users,
    defaultRoundId,
  };
}

/**
 * Fetch user lineup for a specific round
 * @param {string} userId
 * @param {string} roundId
 * @returns {Promise<Object>} Lineup details
 */
export async function fetchUserLineup(userId, roundId) {
  return await getUserLineup(userId, roundId);
}
