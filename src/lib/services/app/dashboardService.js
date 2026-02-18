import 'server-only';

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
  getSimpleStandings as getStandings,
  getLastRoundWinner,
  getLeaderComparison,
  getTopPlayers,
  getPlayersBirthday,
  getLastRoundStats,
  getRecentTransfers,
  getSignificantPriceChanges,
  getRecentRecords,
  getStreakStats,
  getCurrentRoundState,
  getUpcomingMatches,
  getRecentResults,
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

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get round preparation data (Current status + Next round info)
 * @param {string} [userId] - Optional user ID for personalized recommendations
 * @returns {Promise<Object>} Round data bundle
 */
export async function getNextRoundData(userId = null) {
  const [roundState, topPlayersForm, captainRecommendations, marketOpportunities] =
    await Promise.all([
      getCurrentRoundState(),
      getTopPlayersByForm(5, 3),
      userId ? getCaptainRecommendations(userId, 6) : [],
      getMarketOpportunities(6),
    ]);

  // If next round exists, get its full details for the dashboard
  let nextRoundDetails = null;
  if (roundState.nextRound) {
    // We need to import getRoundDetails or reuse existing logic.
    // Since getNextRound (deprecated) returns details, let's use the new getRoundDetails from DB.
    // But I haven't imported it yet. I need to update imports first.
    // For now, I will use getNextRound() which I updated to use getCurrentRoundState() internally,
    // BUT getNextRound() returns the *details*, so that works for "nextRound".
    // Actually, distinct separation is better. Let's update imports to include getRoundDetails.
  }

  // For backward compatibility while I update imports in next step:
  // The original code called getNextRound().
  // My new getNextRound() calls getCurrentRoundState() then getRoundDetails(nextRound.id).
  // So simply calling getNextRound() here will still work and return the detailed next round.

  // However, I want to expose "currentRound" status too if possible?
  // The dashboard might want to know if a round is LIVE.

  const nextRound = await getNextRound(); // Uses new logic under the hood

  return {
    nextRound,
    currentRoundStatus: roundState.currentRound,
    topPlayersForm,
    captainRecommendations,
    marketOpportunities,
  };
}

/**
 * Fetch statistics for the public landing page
 * @returns {Promise<Object>} { userCount, currentRound, weeksToPlayoffs, playoffStartRound }
 */
export async function fetchLandingStats() {
  const standings = await getStandings();
  const userCount = standings.length;

  const { currentRound } = await getCurrentRoundState();
  let roundNumber = 0;

  if (currentRound && currentRound.round_name) {
    const match = currentRound.round_name.match(/\d+/);
    if (match) {
      roundNumber = parseInt(match[0], 10);
    }
  }

  const PLAYOFF_START_ROUND = 39;
  let weeksToPlayoffs = 0;
  if (roundNumber > 0) {
    weeksToPlayoffs = Math.max(0, PLAYOFF_START_ROUND - roundNumber);
  }

  return {
    userCount,
    currentRound: currentRound?.round_name || 'Pre-Season',
    weeksToPlayoffs,
    playoffStartRound: PLAYOFF_START_ROUND,
  };
}

/**
 * Fetch aggregated news feed for the ticker
 * Combines recent transfers, price changes, upcoming matches, and recent results.
 * @returns {Promise<Array<{type: string, text: string, timestamp: number}>>} Sorted list of news items
 */
export async function fetchNewsFeed() {
  const news = [];

  // 1. Transfers
  try {
    const transfers = await getRecentTransfers(5);
    transfers.forEach((t) => {
      const amount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(t.precio);
      news.push({
        type: 'transfer',
        text: `FICHAJE: ${t.player_name} (${t.position}) pasa de ${t.vendedor || 'Mercado'} a ${t.comprador || 'Mercado'} por ${amount}`,
        timestamp: t.timestamp,
      });
    });
  } catch (e) {
    console.error('Error fetching transfers:', e);
  }

  // 2. Price Changes
  try {
    const priceChanges = await getSignificantPriceChanges(24, 200000);
    priceChanges.forEach((c) => {
      const amount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(Math.abs(c.price_increment));
      const direction = c.price_increment > 0 ? 'sube' : 'baja';
      news.push({
        type: c.price_increment > 0 ? 'price_up' : 'price_down',
        text: `MERCADO: ${c.name} ${direction} ${amount} hoy`,
        timestamp: Date.now(),
      });
    });
  } catch (e) {
    console.error('Error fetching price changes:', e);
  }

  // 3. Upcoming Matches (3)
  try {
    const matches = await getUpcomingMatches(3);
    matches.forEach((m) => {
      const date = new Date(m.date);
      const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const day = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      news.push({
        type: 'match',
        text: `PRÓXIMO: ${m.home_team} vs ${m.away_team} (${day} ${time})`,
        timestamp: new Date(m.date).getTime(),
      });
    });
  } catch (e) {
    console.error('Error fetching upcoming matches:', e);
  }

  // 4. Recent Results (3)
  try {
    const results = await getRecentResults(3);
    results.forEach((m) => {
      news.push({
        type: 'result',
        text: `RESULTADO: ${m.home_team} ${m.home_score} - ${m.away_score} ${m.away_team}`,
        timestamp: new Date(m.date).getTime(),
      });
    });
  } catch (e) {
    console.error('Error fetching results:', e);
  }

  // Random shuffle
  return news.sort(() => 0.5 - Math.random());
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
