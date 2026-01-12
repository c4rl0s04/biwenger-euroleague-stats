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
  getLeagueAveragePoints,
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
  getStreakStats,
} from '@/lib/db';

// ============ DIRECT WRAPPERS ============
// These wrap query functions 1:1 for consistent service layer usage

export async function fetchCaptainStats(userId) {
  return await getUserCaptainStats(userId);
}

export async function fetchHomeAwayStats(userId) {
  return await getUserHomeAwayStats(userId);
}

export async function fetchLeagueAveragePoints() {
  return await getLeagueAveragePoints();
}

export async function fetchLastRoundMVPs() {
  return await getLastRoundMVPs();
}

export async function fetchRisingStars() {
  return await getRisingStars();
}

export async function fetchStandingsPreview() {
  const [standings, lastRoundWinner] = await Promise.all([getStandings(), getLastRoundWinner()]);

  return {
    standings: standings, // Show all users instead of top 5
    totalUsers: standings.length,
    lastRoundWinner,
  };
}

export async function fetchLeaderComparison(userId) {
  return await getLeaderComparison(userId);
}

export async function fetchTopPlayers() {
  return await getTopPlayers();
}

export async function fetchPlayerBirthdays() {
  return await getPlayersBirthday();
}

export async function fetchLastRoundStats() {
  return await getLastRoundStats();
}

export async function fetchTopPlayersByForm(limit = 5, rounds = 3) {
  return await getTopPlayersByForm(limit, rounds);
}

export async function fetchCaptainRecommendations(userId, limit = 6) {
  return await getCaptainRecommendations(userId, limit);
}

export async function fetchMarketOpportunities(limit = 6) {
  return await getMarketOpportunities(limit);
}

export async function fetchNextRound() {
  return await getNextRound();
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get next round preparation data
 * @param {string} [userId] - Optional user ID for personalized recommendations
 * @returns {Promise<Object>} Next round data bundle
 */
export async function getNextRoundData(userId = null) {
  const [nextRound, topPlayersForm, captainRecommendations, marketOpportunities] =
    await Promise.all([
      getNextRound(),
      getTopPlayersByForm(5, 3),
      userId ? getCaptainRecommendations(userId, 6) : [],
      getMarketOpportunities(6),
    ]);

  return {
    nextRound,
    topPlayersForm,
    captainRecommendations,
    marketOpportunities,
  };
}

/**
 * Get user's personal dashboard data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Personalized dashboard data
 */
export async function getUserDashboardData(userId) {
  if (!userId) {
    return { error: 'User ID required' };
  }

  const [seasonStats, captainStats, homeAwayStats, alerts, squadDetails, leaderGap] =
    await Promise.all([
      getUserSeasonStats(userId),
      getUserCaptainStats(userId),
      getUserHomeAwayStats(userId),
      getPersonalizedAlerts(userId, 5),
      getUserSquadDetails(userId),
      getLeaderComparison(userId),
    ]);

  return {
    seasonStats,
    captainStats,
    homeAwayStats,
    alerts,
    squadDetails,
    leaderGap,
  };
}

/**
 * Get league-wide dashboard widgets data
 * @returns {Promise<Object>} League dashboard data
 */
export async function getLeagueDashboardData() {
  const [streaks, leagueAverage, roundMVPs, upcomingBirthdays] = await Promise.all([
    getStreakStats(),
    getLeagueAveragePoints(),
    getLastRoundMVPs(5),
    getPlayersBirthday(),
  ]);

  return {
    leagueAverage,
    roundMVPs,
    upcomingBirthdays,
    hotStreaks: streaks.hot?.slice(0, 3) || [],
    coldStreaks: streaks.cold?.slice(0, 3) || [],
  };
}

/**
 * Get streak data for a specific type
 * @param {'hot' | 'cold'} type - Streak type
 * @param {number} [limit=5] - Number of results
 * @returns {Promise<Array>} Streak data
 */
export async function getStreakData(type, limit = 5) {
  const streaks = await getStreakStats();
  const data = type === 'hot' ? streaks.hot : streaks.cold;
  return data?.slice(0, limit) || [];
}

/**
 * Get recent activity data for dashboard
 * @param {string} [userId] - Optional user ID for personalized alerts
 * @returns {Promise<Object>} Recent activity data
 */
export async function getRecentActivityData(userId = null) {
  const [recentTransfers, priceChanges, recentRecords, personalizedAlerts] = await Promise.all([
    getRecentTransfers(8),
    getSignificantPriceChanges(24, 500000),
    getRecentRecords(),
    userId ? getPersonalizedAlerts(userId, 5) : [],
  ]);

  return {
    recentTransfers,
    priceChanges,
    recentRecords,
    personalizedAlerts,
  };
}
