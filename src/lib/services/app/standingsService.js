import 'server-only';

/**
 * Standings Service
 * Business logic layer for standings-related operations
 *
 * @fileoverview Aggregates and transforms standings data from multiple queries
 */

import {
  getExtendedStandings,
  getLeagueTotals,
  getRoundWinners,
  getPointsProgression,
  getValueRanking,
  getWinCounts,
  getStreakStats,
  getVolatilityStats,
  getEfficiencyStats,
  getPlacementStats,
  getBottlerStats,
  getHeartbreakerStats,
  getNoGloryStats,
  getJinxStats,
  getInitialSquadActualPerformance,
  getLeagueComparisonStats,
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getAllPlayAllStats,
  getDominanceStats,
  getTheoreticalGapStats,
  getHeatmapStats,
  getPositionChangesStats,
  getReliabilityStats,
  getRivalryMatrixStats,
} from '@/lib/db';

/**
 * @typedef {import('@/lib/db/types').UserStanding} UserStanding
 * @typedef {import('@/lib/db/types').LeagueTotals} LeagueTotals
 */

// ============ DIRECT WRAPPERS ============
// These wrap query functions 1:1 for consistent service layer usage

/**
 * Get full extended standings with detailed breakdown
 * @param {Object} options - Configuration options
 * @param {string} [options.sortBy] - Sort column
 * @param {string} [options.direction] - Sort direction
 * @returns {Promise<UserStanding[]>}
 */
export async function getFullStandings(options = {}) {
  return await getExtendedStandings(options);
}

/**
 * Get overall league statistical overview
 * @returns {Promise<LeagueTotals>}
 */
export async function getLeagueOverview() {
  return await getLeagueTotals();
}

/**
 * Fetch users who have won the most rounds
 * @param {number} [limit=15]
 * @returns {Promise<Array>}
 */
export async function fetchRoundWinners(limit = 15) {
  return await getRoundWinners(limit);
}

/**
 * Fetch week-by-week points progression for graph
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
export async function fetchPointsProgression(limit = 50) {
  return await getPointsProgression(limit);
}

/**
 * Fetch ranking of teams by squad value/budget
 * @returns {Promise<Array>}
 */
export async function fetchValueRanking() {
  return await getValueRanking();
}

/** @returns {Promise<Object>} Hot and Cold streaks */
export async function fetchStreakStats() {
  return await getStreakStats();
}

/** @returns {Promise<Array>} Volatility (Standard Deviation) stats */
export async function fetchVolatilityStats() {
  return await getVolatilityStats();
}

/** @returns {Promise<Array>} Efficiency ratings */
export async function fetchEfficiencyStats() {
  return await getEfficiencyStats();
}

/** @returns {Promise<Array>} Average placement stats */
export async function fetchPlacementStats() {
  return await getPlacementStats();
}

/** @returns {Promise<Array>} Users who lose big leads */
export async function fetchBottlerStats() {
  return await getBottlerStats();
}

/** @returns {Promise<Array>} Users who lose by small margins */
export async function fetchHeartbreakerStats() {
  return await getHeartbreakerStats();
}

/** @returns {Promise<Array>} High scores that didn't win rounds */
export async function fetchNoGloryStats() {
  return await getNoGloryStats();
}

/** @returns {Promise<Array>} Users who score low but win against low scorers */
export async function fetchJinxStats() {
  return await getJinxStats();
}

/** @returns {Promise<Array>} Performance of original draft squads */
export async function fetchInitialSquadAnalytics() {
  return await getInitialSquadActualPerformance();
}

/**
 * Compare a user against league averages
 * @param {string} userId
 */
export async function fetchLeagueComparisonStats(userId) {
  return await getLeagueComparisonStats(userId);
}

// ============ ADVANCED STATS WRAPPERS ============

/** @returns {Promise<Object>} Heat Check (Overperformance) stats */
export async function fetchHeatCheckStats() {
  return await getHeatCheckStats();
}

/** @returns {Promise<Array>} Hunter (Chasing leader) stats */
export async function fetchHunterStats() {
  return await getHunterStats();
}

/** @returns {Promise<Array>} Rolling average points stats */
export async function fetchRollingAverageStats() {
  return await getRollingAverageStats();
}

/** @returns {Promise<Array>} Floor vs Ceiling analysis */
export async function fetchFloorCeilingStats() {
  return await getFloorCeilingStats();
}

/** @returns {Promise<Object>} Point distribution (Standard Deviation etc.) */
export async function fetchPointDistributionStats() {
  return await getPointDistributionStats();
}

/** @returns {Promise<Object>} All-Play-All league table */
export async function fetchAllPlayAllStats() {
  return await getAllPlayAllStats();
}

/** @returns {Promise<Array>} Dominance metrics */
export async function fetchDominanceStats() {
  return await getDominanceStats();
}

/** @returns {Promise<Object>} Theoretical max points analysis */
export async function fetchTheoreticalGapStats() {
  return await getTheoreticalGapStats();
}

/** @returns {Promise<Object>} Heatmap grid data */
export async function fetchHeatmapStats() {
  return await getHeatmapStats();
}

/** @returns {Promise<Array>} Position change volatility */
export async function fetchPositionChangesStats() {
  return await getPositionChangesStats();
}

/** @returns {Promise<Array>} Consistency ratings */
export async function fetchReliabilityStats() {
  return await getReliabilityStats();
}

/** @returns {Promise<Object>} Head-to-head rivalry matrix */
export async function fetchRivalryMatrixStats() {
  return await getRivalryMatrixStats();
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get standings page data bundle
 * @param {Object} options - Configuration options
 * @param {number} [options.roundsLimit=15] - Number of round winners
 * @param {number} [options.progressionLimit=10] - Rounds for progression
 * @returns {Promise<Object>} Bundled standings page data
 */
export async function getStandingsPageData(options = {}) {
  const { roundsLimit = 15, progressionLimit = 10 } = options;

  const [standings, leagueTotals, roundWinners, pointsProgression, valueRanking, winCounts] =
    await Promise.all([
      getExtendedStandings(),
      getLeagueTotals(),
      getRoundWinners(roundsLimit),
      getPointsProgression(progressionLimit),
      getValueRanking(),
      getWinCounts(),
    ]);

  return {
    standings,
    leagueTotals,
    roundWinners,
    pointsProgression,
    valueRanking,
    winCounts,
  };
}

/**
 * Get user's position and gap to leader
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Position data with gaps
 */
export async function getUserPositionData(userId) {
  const standings = await getExtendedStandings();
  const userIndex = standings.findIndex((u) => String(u.user_id) === String(userId));

  if (userIndex === -1) {
    return { found: false, position: null, gap: null };
  }

  const user = standings[userIndex];
  const leader = standings[0];

  return {
    found: true,
    position: user.position,
    totalPoints: user.total_points,
    gapToLeader: leader.total_points - user.total_points,
    gapToNext: userIndex > 0 ? standings[userIndex - 1].total_points - user.total_points : 0,
    leadOverNext:
      userIndex < standings.length - 1
        ? user.total_points - standings[userIndex + 1].total_points
        : 0,
    leader: { name: leader.name, totalPoints: leader.total_points },
  };
}
