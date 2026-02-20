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
  getCoachRating,
  getRoundGlobalStats,
  getIdealLineup,
  getPlayersLeftOut,
  getUserRoundsHistoryDAO,
  getUserOptimization,
  getCurrentRoundState as fetchCurrentRoundState,
  getLineupUsageStats,
} from '../../db';
import { getAllUsers } from '../../db';
import { calculateStats } from '../../logic/performance';

export interface UserRoundStandings {
  id: number;
  name?: string;
  points?: number;
  ideal_points?: number;
  [key: string]: any;
}

/**
 * Fetch standings for a specific round with fallback logic
 * 1. Try to get OFFICIAL standings (user_rounds) if available.
 * 2. If not, calculate LIVE standings from lineups + player stats.
 * 3. [NEW] Enrich with Ideal Lineup Points for everyone.
 *
 * @param roundId
 * @returns 
 */
export async function fetchRoundStandings(roundId: string | number): Promise<UserRoundStandings[]> {
  if (!roundId) return [];

  // Check if official stats exist
  const isOfficial = await hasOfficialStats(roundId);

  let standings: any[] = [];
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
 * @param roundId - The ID of the round to fetch
 * @returns Complete round data object
 */
export async function fetchRoundCompleteData(roundId: string | number) {
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
        const [lineup, coachRating, leftOut] = await Promise.all([
          getUserLineup(String(user.id), String(roundId)),
          getCoachRating(String(user.id), String(roundId)),
          getPlayersLeftOut(String(user.id), String(roundId)),
        ]);

        return {
          ...user,
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

export interface UserPerformanceHistory {
  round_id: number;
  round_number: number;
  round_name: string;
  actual_points: number;
  ideal_points: number;
  efficiency: number;
  participated: boolean;
  [key: string]: any;
}

/**
 * Service: Get Full Performance History for a User
 * Orchestrates DAO fetch + Logic calculation (Ideal Points & Efficiency)
 *
 * @param userId - The user ID to fetch history for
 * @returns Chronological list of user performance per round
 */
export async function getUserPerformanceHistoryService(userId: string | number): Promise<UserPerformanceHistory[]> {
  // 1. Get raw history from DAO (includes non-participated)
  const rawRounds = await getUserRoundsHistoryDAO(String(userId));

  if (!rawRounds || rawRounds.length === 0) return [];

  // 2. Iterate direct results (Trust user_rounds points regardless of participation)
  const historyWithIdeal = await Promise.all(
    rawRounds.map(async (round: any) => {
      // Extract round number from name
      const roundNumberMatch = round.round_name.match(/(\d+)$/);
      const roundNumber = roundNumberMatch ? parseInt(roundNumberMatch[1]) : 0;

      // Always use the stored points, even if they didn't "participate" (e.g. general rounds)
      const participated = round.participated;
      const actualPoints = parseFloat(round.actual_points) || 0;

      try {
        // Business Logic: Calculate ideal points
        const coachRating = await getCoachRating(String(userId), String(round.round_id));

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
 * @returns Initial data for rounds context
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
 * @param userId
 * @param roundId
 * @returns Lineup details
 */
export async function fetchUserLineup(userId: string | number, roundId: string | number) {
  return await getUserLineup(String(userId), String(roundId));
}

/**
 * Service: Get the state of current and next rounds
 * Wraps the DB query to expose unified round state
 * @returns { currentRound, nextRound }
 */
export async function getCurrentRoundState() {
  return await fetchCurrentRoundState();
}

/**
 * Service: Get Leaderboard Data (Aggregated Stats for all users).
 * Calculates average efficiency, total points lost, and best/worst performances.
 * Replaces logic in api/rounds/leaderboard.
 *
 * @returns Leaderboard sorted by average efficiency (descending)
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

function generateEmptyStats(userId: string | number) {
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
export async function fetchUserRoundDetails(roundId: string | number, userId?: string | number) {
  const [globalStats, idealLineup, userStats, leftOut, coachRating] = await Promise.all([
    getRoundGlobalStats(roundId),
    getIdealLineup(roundId),
    userId ? getUserOptimization(String(userId), String(roundId)) : null,
    userId ? getPlayersLeftOut(String(userId), String(roundId)) : [],
    userId ? getCoachRating(String(userId), String(roundId)) : null,
  ]);

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
  const totalGlobalRounds = global.reduce((sum: number, item: any) => sum + item.count, 0);
  const globalStats = global.map((item: any) => ({
    formation: item.alineacion,
    count: item.count,
    percentage: totalGlobalRounds > 0 ? (item.count / totalGlobalRounds) * 100 : 0,
  }));

  // 2. Process User Favorites
  // byUser is already sorted by count DESC per user, so first entry per user is their favorite
  const userStats = users
    .map((user) => {
      const userEntries = byUser.filter((u: any) => u.user_id === user.id);
      const totalUserRounds = userEntries.reduce((sum: number, item: any) => sum + item.count, 0);

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
