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
  getCoachRating, // Import this
  getRoundGlobalStats, // Import
  getIdealLineup, // Import
  getPlayersLeftOut, // Import
  getUserRoundsHistoryDAO, // New DAO for raw history
} from '../db/queries/rounds.js';
import { getAllUsers } from '../db/queries/users.js';

/**
 * Fetch standings for a specific round with fallback logic
 * 1. Try to get OFFICIAL standings (user_rounds) if available.
 * 2. If not, calculate LIVE standings from lineups + player stats.
 * 3. [NEW] Enrich with Ideal Lineup Points for everyone.
 *
 * @param {string} roundId
 * @returns {Promise<Array>}
 */
export async function fetchRoundStandings(roundId) {
  if (!roundId) return [];

  // Check if official stats exist
  const isOfficial = await hasOfficialStats(roundId);

  let standings = [];
  if (isOfficial) {
    standings = await getOfficialStandings(roundId);
  } else {
    standings = await getLivingStandings(roundId);
  }

  // Optimize: Calculate "Ideal Points" for everyone in parallel
  // This reuses the robust "Valid Formation" logic from getCoachRating
  const enrichedStandings = await Promise.all(
    standings.map(async (user) => {
      try {
        const rating = await getCoachRating(user.id, roundId);
        return {
          ...user,
          ideal_points: rating?.maxScore || 0,
        };
      } catch (e) {
        console.error(`Failed to calc ideal for user ${user.id}`, e);
        return { ...user, ideal_points: 0 };
      }
    })
  );

  return enrichedStandings;
}

/**
 * Fetch EVERYTHING for the Rounds Page in one go.
 * Calculated once to ensure consistency between Standings & Individual Cards.
 *
 * @param {string} roundId
 */
export async function fetchRoundCompleteData(roundId) {
  if (!roundId) return null;

  // 1. Fetch Global Context
  const [globalStats, globalIdealLineup, baseStandings] = await Promise.all([
    getRoundGlobalStats(roundId),
    getIdealLineup(roundId),
    fetchRoundStandings(roundId), // Reuses the logic to get list + basic points + ideal points
  ]);

  // 2. Fetch Detailed Data for EVERY User (Parallelized)
  // This might be heavy (~20 users), but ensures instant switching on frontend.
  const usersDetailed = await Promise.all(
    baseStandings.map(async (user) => {
      try {
        // We already calculated ideal_points in fetchRoundStandings via getCoachRating
        // But fetchRoundStandings didn't return the full Ideal Lineup array or actual Lineup.
        // So we need to fetch the details.
        // Optimization: fetchRoundStandings *already* called getCoachRating internally.
        // If we want to avoid calling it twice, we should refactor fetchRoundStandings OR just call getCoachRating again (it's fast-ish).

        // Let's call the specific data getters
        const [lineup, coachRating, leftOut] = await Promise.all([
          getUserLineup(user.id, roundId),
          getCoachRating(user.id, roundId),
          getPlayersLeftOut(user.id, roundId),
        ]);

        return {
          ...user, // id, name, icon, points, ideal_points, etc.
          lineup, // Actual Squad
          idealLineup: coachRating?.idealLineup || [],
          coachRating: coachRating, // Full rating object
          leftOut: leftOut || [],
        };
      } catch (e) {
        console.error(`Error fetching details for user ${user.id}`, e);
        return user;
      }
    })
  );

  return {
    global: globalStats,
    idealLineup: globalIdealLineup,
    users: usersDetailed, // The "Mega List" with everything
  };
}

/**
 * Service: Get Full Performance History
 * Orchestrates DAO fetch + Logic calculation (Ideal Points)
 * @param {string} userId
 */
export async function getUserPerformanceHistoryService(userId) {
  // 1. Get raw history from DAO (includes non-participated)
  const rawRounds = await getUserRoundsHistoryDAO(userId);

  if (!rawRounds || rawRounds.length === 0) return [];

  // 2. Iterate direct results (DAO now returns all rounds including non-participated)
  const historyWithIdeal = await Promise.all(
    rawRounds.map(async (round) => {
      // Extract round number from name
      const roundNumberMatch = round.round_name.match(/(\d+)$/);
      const roundNumber = roundNumberMatch ? parseInt(roundNumberMatch[1]) : 0;

      // If not participated, actual is 0. If participated, use stored points.
      const participated = round.participated;
      const actualPoints = participated ? parseFloat(round.actual_points) || 0 : 0;

      try {
        // Business Logic: Calculate ideal points
        const coachRating = await getCoachRating(userId, round.round_id);

        const idealPoints = coachRating?.maxScore || actualPoints;

        let efficiency = 0;
        if (idealPoints > 0) {
          efficiency = (actualPoints / idealPoints) * 100;
        } else if (actualPoints > 0) {
          efficiency = 100;
        }

        return {
          round_id: round.round_id,
          round_number: roundNumber,
          round_name: round.round_name,
          actual_points: actualPoints,
          ideal_points: idealPoints,
          efficiency: parseFloat(efficiency.toFixed(1)),
          participated: participated,
        };
      } catch (err) {
        console.error(`Error calculating ideal for round ${round.round_id}:`, err);
        return {
          round_id: round.round_id,
          round_number: roundNumber,
          round_name: round.round_name,
          actual_points: actualPoints,
          ideal_points: actualPoints, // Fallback
          efficiency: participated ? 100 : 0,
          participated: participated,
        };
      }
    })
  );

  // 3. Ensure strict sorting
  return historyWithIdeal.sort((a, b) => a.round_number - b.round_number);
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
