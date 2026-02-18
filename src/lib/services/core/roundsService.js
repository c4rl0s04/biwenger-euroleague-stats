import 'server-only';

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
  getUserOptimization, // Import
  getCurrentRoundState as fetchCurrentRoundState, // Import Query
  getLineupUsageStats, // Import
} from '../../db';
import { getAllUsers } from '../../db';

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
 * Fetch ALL data required for the Rounds Page for a specific round.
 * Optimizes fetching by parallelizing global stats and detailed user stats.
 *
 * @param {string} roundId - The ID of the round to fetch
 * @returns {Promise<{
 *   global: Object,
 *   idealLineup: Array,
 *   users: Array<{
 *     id: string,
 *     name: string,
 *     points: number,
 *     ideal_points: number,
 *     lineup: Object,
 *     idealLineup: Array,
 *     coachRating: Object,
 *     leftOut: Array
 *   }>
 * }>} Complete round data object
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
 * Service: Get Full Performance History for a User
 * Orchestrates DAO fetch + Logic calculation (Ideal Points & Efficiency)
 *
 * @param {string} userId - The user ID to fetch history for
 * @returns {Promise<Array<{
 *   round_id: number,
 *   round_number: number,
 *   round_name: string,
 *   actual_points: number,
 *   ideal_points: number,
 *   efficiency: number,
 *   participated: boolean
 * }>>} Chronological list of user performance per round
 */
export async function getUserPerformanceHistoryService(userId) {
  // 1. Get raw history from DAO (includes non-participated)
  const rawRounds = await getUserRoundsHistoryDAO(userId);

  if (!rawRounds || rawRounds.length === 0) return [];

  // 2. Iterate direct results (Trust user_rounds points regardless of participation)
  const historyWithIdeal = await Promise.all(
    rawRounds.map(async (round) => {
      // Extract round number from name
      const roundNumberMatch = round.round_name.match(/(\d+)$/);
      const roundNumber = roundNumberMatch ? parseInt(roundNumberMatch[1]) : 0;

      // Always use the stored points, even if they didn't "participate" (e.g. general rounds)
      const participated = round.participated;
      const actualPoints = parseFloat(round.actual_points) || 0;

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
 * Fetch all necessary data for the Rounds list/selector.
 * Useful for initializing the rounds page dropdowns.
 *
 * @returns {Promise<{
 *   rounds: Array,
 *   users: Array,
 *   defaultRoundId: string|number
 * }>} Initial data for rounds context
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

/**
 * Service: Get the state of current and next rounds
 * Wraps the DB query to expose unified round state
 * @returns {Promise<Object>} { currentRound, nextRound }
 */
export async function getCurrentRoundState() {
  return await fetchCurrentRoundState();
}

// --- New Methods for API Support (Strict Layer Enforcement) ---

import { calculateStats } from '../../logic/performance';

/**
 * Service: Get Leaderboard Data (Aggregated Stats for all users).
 * Calculates average efficiency, total points lost, and best/worst performances.
 * Replaces logic in api/rounds/leaderboard.
 *
 * @returns {Promise<Array<{
 *   userId: string,
 *   avgEfficiency: string,
 *   totalLost: number,
 *   bestActual: number,
 *   worstActual: number,
 *   bestEfficiency: number,
 *   roundsPlayed: number
 * }>>} Leaderboard sorted by average efficiency (descending)
 */
export async function fetchRoundLeaderboard() {
  const users = await getAllUsers();
  if (!users || users.length === 0) return [];

  const leaderboardData = await Promise.all(
    users.map(async (user) => {
      try {
        const history = await getUserPerformanceHistoryService(user.id);
        const stats = calculateStats(history);

        if (!stats) return generateEmptyStats(user.id);

        return {
          userId: user.id,
          avgEfficiency: stats.avgEfficiency,
          totalLost: stats.totalLost,
          bestActual: stats.bestRound?.actual_points || 0,
          worstActual: stats.worstRound?.actual_points || 0,
          bestEfficiency: stats.bestEffRound?.efficiency || 0,
          bestEffRound: stats.bestEffRound?.round_number || null,
          worstEfficiency: stats.worstEffRound?.efficiency || 0,
          worstEffRound: stats.worstEffRound?.round_number || null,
          roundsPlayed: stats.roundsPlayed,
        };
      } catch (err) {
        console.error(`Error fetching stats for user ${user.id}:`, err);
        return generateEmptyStats(user.id);
      }
    })
  );

  // Default sort by efficiency
  return leaderboardData.sort((a, b) => parseFloat(b.avgEfficiency) - parseFloat(a.avgEfficiency));
}

function generateEmptyStats(userId) {
  return {
    userId,
    avgEfficiency: '0.0',
    totalLost: 0,
    bestActual: 0,
    worstActual: 0,
    bestEfficiency: 0,
    round_number: null,
    worstEfficiency: 0,
    worstEffRound: null,
    roundsPlayed: 0,
  };
}

/**
 * Service: Get All Users History (for Heatmap)
 * Replaces logic in api/rounds/all-history
 */
export async function fetchAllUsersPerformanceHistory() {
  const users = await getAllUsers();
  if (!users) return [];

  return await Promise.all(
    users.map(async (user) => {
      try {
        const history = await getUserPerformanceHistoryService(user.id);
        return {
          userId: user.id,
          history: history || [],
        };
      } catch (err) {
        console.error(`Error fetching history for user ${user.id}`, err);
        return { userId: user.id, history: [] };
      }
    })
  );
}

/**
 * Service: Get Specific User Round Stats (Legacy Mode)
 * Replaces logic in api/rounds/stats (legacy path)
 */
export async function fetchUserRoundDetails(roundId, userId) {
  const [globalStats, idealLineup, userStats, leftOut, coachRating] = await Promise.all([
    getRoundGlobalStats(roundId),
    getIdealLineup(roundId),
    userId ? getUserOptimization(userId, roundId) : null,
    userId ? getPlayersLeftOut(userId, roundId) : [],
    userId ? getCoachRating(userId, roundId) : null,
  ]);
  // Dynamic import above for getUserOptimization to avoid circular dep if it's not exported in index properly,
  // but let's assume imports at top are fine. Wait, getUserOptimization wasn't imported at top.
  // I need to add getUserOptimization to top imports.

  return {
    global: globalStats,
    idealLineup,
    user: {
      ...(userStats || {}),
      coachRating,
      idealLineup: coachRating?.idealLineup,
      leftOut,
    },
  };
}

/**
 * Service: Get Lineup Usage Statistics (Favorites & Global)
 * Processes raw DB data into consumable format (percentages, favorites)
 */
export async function fetchLineupStats() {
  const { global, byUser } = await getLineupUsageStats();
  const users = await getAllUsers();

  // 1. Calculate Global Percentages
  const totalGlobalRounds = global.reduce((sum, item) => sum + item.count, 0);
  const globalStats = global.map((item) => ({
    formation: item.alineacion,
    count: item.count,
    percentage: totalGlobalRounds > 0 ? (item.count / totalGlobalRounds) * 100 : 0,
  }));

  // 2. Process User Favorites
  // byUser is already sorted by count DESC per user, so first entry per user is their favorite
  const userStats = users
    .map((user) => {
      const userEntries = byUser.filter((u) => u.user_id === user.id);
      const totalUserRounds = userEntries.reduce((sum, item) => sum + item.count, 0);

      // Find favorite (highest count)
      const favorite = userEntries.length > 0 ? userEntries[0] : null;

      return {
        userId: user.id,
        name: user.name,
        icon: user.icon, // Needed for UI
        color_index: user.color_index, // Needed for UI
        favorite: favorite
          ? {
              formation: favorite.alineacion,
              count: favorite.count,
              percentage: totalUserRounds > 0 ? (favorite.count / totalUserRounds) * 100 : 0,
            }
          : null,
        totalRounds: totalUserRounds,
      };
    })
    .filter((u) => u.favorite !== null) // Exclude users with no data
    .sort((a, b) => b.totalRounds - a.totalRounds); // Sort by activity? Or maybe by favorite %?

  return {
    global: globalStats,
    users: userStats,
  };
}
