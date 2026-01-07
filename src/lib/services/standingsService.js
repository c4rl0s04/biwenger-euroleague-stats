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

/** @returns {UserStanding[]} */
export function getFullStandings() {
  return getExtendedStandings();
}

/** @returns {LeagueTotals} */
export function getLeagueOverview() {
  return getLeagueTotals();
}

export function fetchRoundWinners(limit = 15) {
  return getRoundWinners(limit);
}

export function fetchPointsProgression(limit = 50) {
  return getPointsProgression(limit);
}

export function fetchValueRanking() {
  return getValueRanking();
}

export function fetchStreakStats() {
  return getStreakStats();
}

export function fetchVolatilityStats() {
  return getVolatilityStats();
}

export function fetchEfficiencyStats() {
  return getEfficiencyStats();
}

export function fetchPlacementStats() {
  return getPlacementStats();
}

export function fetchBottlerStats() {
  return getBottlerStats();
}

export function fetchHeartbreakerStats() {
  return getHeartbreakerStats();
}

export function fetchNoGloryStats() {
  return getNoGloryStats();
}

export function fetchJinxStats() {
  return getJinxStats();
}

export function fetchInitialSquadAnalytics() {
  return getInitialSquadActualPerformance();
}

export function fetchLeagueComparisonStats(userId) {
  return getLeagueComparisonStats(userId);
}

// ============ ADVANCED STATS WRAPPERS ============

export function fetchHeatCheckStats() {
  return getHeatCheckStats();
}

export function fetchHunterStats() {
  return getHunterStats();
}

export function fetchRollingAverageStats() {
  return getRollingAverageStats();
}

export function fetchFloorCeilingStats() {
  return getFloorCeilingStats();
}

export function fetchPointDistributionStats() {
  return getPointDistributionStats();
}

export function fetchAllPlayAllStats() {
  return getAllPlayAllStats();
}

export function fetchDominanceStats() {
  return getDominanceStats();
}

export function fetchTheoreticalGapStats() {
  return getTheoreticalGapStats();
}

export function fetchHeatmapStats() {
  return getHeatmapStats();
}

export function fetchPositionChangesStats() {
  return getPositionChangesStats();
}

export function fetchReliabilityStats() {
  return getReliabilityStats();
}

export function fetchRivalryMatrixStats() {
  return getRivalryMatrixStats();
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get standings page data bundle
 * @param {Object} options - Configuration options
 * @param {number} [options.roundsLimit=15] - Number of round winners
 * @param {number} [options.progressionLimit=10] - Rounds for progression
 * @returns {Object} Bundled standings page data
 */
export function getStandingsPageData(options = {}) {
  const { roundsLimit = 15, progressionLimit = 10 } = options;

  return {
    standings: getExtendedStandings(),
    leagueTotals: getLeagueTotals(),
    roundWinners: getRoundWinners(roundsLimit),
    pointsProgression: getPointsProgression(progressionLimit),
    valueRanking: getValueRanking(),
    winCounts: getWinCounts(),
  };
}

/**
 * Get user's position and gap to leader
 * @param {string} userId - User ID to check
 * @returns {Object} Position data with gaps
 */
export function getUserPositionData(userId) {
  const standings = getExtendedStandings();
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
