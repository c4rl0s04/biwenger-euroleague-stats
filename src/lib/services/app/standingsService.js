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

/** @returns {Promise<UserStanding[]>} */
export async function getFullStandings() {
  return await getExtendedStandings();
}

/** @returns {Promise<LeagueTotals>} */
export async function getLeagueOverview() {
  return await getLeagueTotals();
}

export async function fetchRoundWinners(limit = 15) {
  return await getRoundWinners(limit);
}

export async function fetchPointsProgression(limit = 50) {
  return await getPointsProgression(limit);
}

export async function fetchValueRanking() {
  return await getValueRanking();
}

export async function fetchStreakStats() {
  return await getStreakStats();
}

export async function fetchVolatilityStats() {
  return await getVolatilityStats();
}

export async function fetchEfficiencyStats() {
  return await getEfficiencyStats();
}

export async function fetchPlacementStats() {
  return await getPlacementStats();
}

export async function fetchBottlerStats() {
  return await getBottlerStats();
}

export async function fetchHeartbreakerStats() {
  return await getHeartbreakerStats();
}

export async function fetchNoGloryStats() {
  return await getNoGloryStats();
}

export async function fetchJinxStats() {
  return await getJinxStats();
}

export async function fetchInitialSquadAnalytics() {
  return await getInitialSquadActualPerformance();
}

export async function fetchLeagueComparisonStats(userId) {
  return await getLeagueComparisonStats(userId);
}

// ============ ADVANCED STATS WRAPPERS ============

export async function fetchHeatCheckStats() {
  return await getHeatCheckStats();
}

export async function fetchHunterStats() {
  return await getHunterStats();
}

export async function fetchRollingAverageStats() {
  return await getRollingAverageStats();
}

export async function fetchFloorCeilingStats() {
  return await getFloorCeilingStats();
}

export async function fetchPointDistributionStats() {
  return await getPointDistributionStats();
}

export async function fetchAllPlayAllStats() {
  return await getAllPlayAllStats();
}

export async function fetchDominanceStats() {
  return await getDominanceStats();
}

export async function fetchTheoreticalGapStats() {
  return await getTheoreticalGapStats();
}

export async function fetchHeatmapStats() {
  return await getHeatmapStats();
}

export async function fetchPositionChangesStats() {
  return await getPositionChangesStats();
}

export async function fetchReliabilityStats() {
  return await getReliabilityStats();
}

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
