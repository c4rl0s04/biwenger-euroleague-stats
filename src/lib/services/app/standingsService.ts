import 'server-only';

/**
 * Standings Service
 * Business logic layer for standings-related operations
 *
 * @fileoverview Aggregates and transforms standings data from multiple queries
 */

import {
  getExtendedStandings,
  getRoundWinners,
  getLeagueTotals,
  getPointsProgression,
  getValueRanking,
  getWinCounts,
} from '../../db/queries/competition/standings';
import {
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
} from '../../db';

export interface StandingsOptions {
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

// ============ DIRECT WRAPPERS ============
// These wrap query functions 1:1 for consistent service layer usage

/**
 * Get full extended standings with detailed breakdown
 * @param options - Configuration options
 */
export async function getFullStandings(options: StandingsOptions = {}) {
  return await getExtendedStandings(options as any);
}

/**
 * Get overall league statistical overview
 */
export async function getLeagueOverview() {
  return await getLeagueTotals();
}

/**
 * Fetch users who have won the most rounds
 * @param limit
 */
export async function fetchRoundWinners(limit: number = 15) {
  return await getRoundWinners(limit);
}

/**
 * Fetch week-by-week points progression for graph
 * @param limit
 */
export async function fetchPointsProgression(limit: number = 50) {
  return await getPointsProgression(limit);
}

/**
 * Fetch ranking of teams by squad value/budget
 */
export async function fetchValueRanking() {
  return await getValueRanking();
}

/** Hot and Cold streaks */
export async function fetchStreakStats() {
  return await getStreakStats();
}

/** Volatility (Standard Deviation) stats */
export async function fetchVolatilityStats() {
  return await getVolatilityStats();
}

/** Efficiency ratings */
export async function fetchEfficiencyStats() {
  return await getEfficiencyStats();
}

/** Average placement stats */
export async function fetchPlacementStats() {
  return await getPlacementStats();
}

/** Users who lose big leads */
export async function fetchBottlerStats() {
  return await getBottlerStats();
}

/** Users who lose by small margins */
export async function fetchHeartbreakerStats() {
  return await getHeartbreakerStats();
}

/** High scores that didn't win rounds */
export async function fetchNoGloryStats() {
  return await getNoGloryStats();
}

/** Users who score low but win against low scorers */
export async function fetchJinxStats() {
  return await getJinxStats();
}

/** Performance of original draft squads */
export async function fetchInitialSquadAnalytics() {
  return await getInitialSquadActualPerformance();
}

/**
 * Compare users against league averages
 */
export async function fetchLeagueComparisonStats() {
  return await getLeagueComparisonStats();
}

// ============ ADVANCED STATS WRAPPERS ============

/** Heat Check (Overperformance) stats */
export async function fetchHeatCheckStats() {
  return await getHeatCheckStats();
}

/** Hunter (Chasing leader) stats */
export async function fetchHunterStats() {
  return await getHunterStats();
}

/** Rolling average points stats */
export async function fetchRollingAverageStats() {
  return await getRollingAverageStats();
}

/** Floor vs Ceiling analysis */
export async function fetchFloorCeilingStats() {
  return await getFloorCeilingStats();
}

/** Point distribution (Standard Deviation etc.) */
export async function fetchPointDistributionStats() {
  return await getPointDistributionStats();
}

/** All-Play-All league table */
export async function fetchAllPlayAllStats() {
  return await getAllPlayAllStats();
}

/** Dominance metrics */
export async function fetchDominanceStats() {
  return await getDominanceStats();
}

/** Theoretical max points analysis */
export async function fetchTheoreticalGapStats() {
  return await getTheoreticalGapStats();
}

/** Heatmap grid data */
export async function fetchHeatmapStats() {
  return await getHeatmapStats();
}

/** Position change volatility */
export async function fetchPositionChangesStats() {
  return await getPositionChangesStats();
}

/** Consistency ratings */
export async function fetchReliabilityStats() {
  return await getReliabilityStats();
}

/** Head-to-head rivalry matrix */
export async function fetchRivalryMatrixStats() {
  return await getRivalryMatrixStats();
}

export interface StandingsPageOptions {
  roundsLimit?: number;
  progressionLimit?: number;
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get standings page data bundle
 * @param options - Configuration options
 * @returns Bundled standings page data
 */
export async function getStandingsPageData(options: StandingsPageOptions = {}) {
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
 * @param userId - User ID to check
 * @returns Position data with gaps
 */
export async function getUserPositionData(userId: string | number) {
  const standings = await getExtendedStandings();
  const userIndex = standings.findIndex((u: any) => String(u.user_id) === String(userId));

  if (userIndex === -1) {
    return { found: false, position: null, gap: null };
  }

  const user = standings[userIndex] as any;
  const leader = standings[0] as any;

  return {
    found: true,
    position: user.position,
    totalPoints: user.total_points,
    gapToLeader: leader.total_points - user.total_points,
    gapToNext: userIndex > 0 ? (standings[userIndex - 1] as any).total_points - user.total_points : 0,
    leadOverNext:
      userIndex < standings.length - 1
        ? user.total_points - (standings[userIndex + 1] as any).total_points
        : 0,
    leader: { name: leader.name, totalPoints: leader.total_points },
  };
}
