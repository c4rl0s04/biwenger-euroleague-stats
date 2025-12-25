/**
 * Dashboard Service
 * Business logic layer for dashboard-related operations
 *
 * @fileoverview Aggregates dashboard data from multiple queries
 */

import {
  getNextRound,
  getTopPlayersByForm,
  getCaptainRecommendations,
  getMarketOpportunities,
  getUserSeasonStats,
  getUserCaptainStats,
  getUserHomeAwayStats,
  getPersonalizedAlerts,
  getUserSquadDetails,
  getLeaderGap,
  getLeagueAveragePoints,
  getRoundMVPs,
  getUpcomingBirthdays,
  getHotStreaks,
  getColdStreaks,
  getLastRoundMVPs,
  getRisingStars,
  getStandings,
  getLastRoundWinner,
  getLeaderComparison,
  getTopPlayers,
  getPlayersBirthday,
  getLastRoundStats,
  getRecentTransfers,
  getSignificantPriceChanges,
  getRecentRecords,
} from '@/lib/db';

// ============ DIRECT WRAPPERS ============
// These wrap query functions 1:1 for consistent service layer usage

export function fetchCaptainStats(userId) {
  return getUserCaptainStats(userId);
}

export function fetchHomeAwayStats(userId) {
  return getUserHomeAwayStats(userId);
}

export function fetchLeagueAveragePoints() {
  return getLeagueAveragePoints();
}

export function fetchLastRoundMVPs() {
  return getLastRoundMVPs();
}

export function fetchRisingStars() {
  return getRisingStars();
}

export function fetchStandingsPreview() {
  const standings = getStandings();
  const lastRoundWinner = getLastRoundWinner();
  return {
    standings: standings.slice(0, 5),
    totalUsers: standings.length,
    lastRoundWinner,
  };
}

export function fetchLeaderComparison(userId) {
  return getLeaderComparison(userId);
}

export function fetchTopPlayers() {
  return getTopPlayers();
}

export function fetchPlayerBirthdays() {
  return getPlayersBirthday();
}

export function fetchLastRoundStats(userId) {
  return getLastRoundStats(userId);
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get next round preparation data
 * @param {string} [userId] - Optional user ID for personalized recommendations
 * @returns {Object} Next round data bundle
 */
export function getNextRoundData(userId = null) {
  return {
    nextRound: getNextRound(),
    topPlayersForm: getTopPlayersByForm(5, 3),
    captainRecommendations: userId ? getCaptainRecommendations(userId, 6) : [],
    marketOpportunities: getMarketOpportunities(6),
  };
}

/**
 * Get user's personal dashboard data
 * @param {string} userId - User ID
 * @returns {Object} Personalized dashboard data
 */
export function getUserDashboardData(userId) {
  if (!userId) {
    return { error: 'User ID required' };
  }

  return {
    seasonStats: getUserSeasonStats(userId),
    captainStats: getUserCaptainStats(userId),
    homeAwayStats: getUserHomeAwayStats(userId),
    alerts: getPersonalizedAlerts(userId, 5),
    squadDetails: getUserSquadDetails(userId),
    leaderGap: getLeaderGap(userId),
  };
}

/**
 * Get league-wide dashboard widgets data
 * @returns {Object} League dashboard data
 */
export function getLeagueDashboardData() {
  return {
    leagueAverage: getLeagueAveragePoints(),
    roundMVPs: getRoundMVPs(5),
    upcomingBirthdays: getUpcomingBirthdays(),
    hotStreaks: getHotStreaks(3),
    coldStreaks: getColdStreaks(3),
  };
}

/**
 * Get streak data for a specific type
 * @param {'hot' | 'cold'} type - Streak type
 * @param {number} [limit=5] - Number of results
 * @returns {Array} Streak data
 */
export function getStreakData(type, limit = 5) {
  return type === 'hot' ? getHotStreaks(limit) : getColdStreaks(limit);
}

/**
 * Get recent activity data for dashboard
 * @param {string} [userId] - Optional user ID for personalized alerts
 * @returns {Object} Recent activity data
 */
export function getRecentActivityData(userId = null) {
  return {
    recentTransfers: getRecentTransfers(8),
    priceChanges: getSignificantPriceChanges(24, 500000),
    recentRecords: getRecentRecords(),
    personalizedAlerts: userId ? getPersonalizedAlerts(userId, 5) : [],
  };
}
