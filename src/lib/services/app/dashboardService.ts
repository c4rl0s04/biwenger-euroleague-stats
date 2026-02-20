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
} from '../../db';

// ============ DIRECT WRAPPERS ============
// These wrap query functions 1:1 for consistent service layer usage

export async function fetchCaptainStats(userId: string | number) {
  return await getUserCaptainStats(userId);
}

export async function fetchHomeAwayStats(userId: string | number) {
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
    totalUsers: standings?.length || 0,
    lastRoundWinner,
  };
}

export async function fetchLeaderComparison(userId: string | number) {
  return await getLeaderComparison(String(userId));
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

export async function fetchTopPlayersByForm(limit: number = 5, rounds: number = 3) {
  return await getTopPlayersByForm(limit, rounds);
}

export async function fetchCaptainRecommendations(userId: string | number, limit: number = 6) {
  return await getCaptainRecommendations(userId, limit);
}

export async function fetchMarketOpportunities(limit: number = 6) {
  return await getMarketOpportunities(limit);
}

export async function fetchNextRound() {
  return await getNextRound();
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get round preparation data (Current status + Next round info)
 * @param userId - Optional user ID for personalized recommendations
 * @returns Round data bundle
 */
export async function getNextRoundData(userId: string | number | null = null) {
  const [roundState, topPlayersForm, captainRecommendations, marketOpportunities] =
    await Promise.all([
      getCurrentRoundState(),
      getTopPlayersByForm(5, 3),
      userId ? getCaptainRecommendations(userId, 6) : [],
      getMarketOpportunities(6),
    ]);

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
 * @returns { userCount, currentRound, weeksToPlayoffs, playoffStartRound }
 */
export async function fetchLandingStats() {
  const standings = await getStandings();
  const userCount = standings?.length || 0;

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

export interface NewsFeedItem {
  type: string;
  text: string;
  timestamp: number;
}

/**
 * Fetch aggregated news feed for the ticker
 * Combines recent transfers, price changes, upcoming matches, and recent results.
 * @returns Sorted list of news items
 */
export async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
  const news: NewsFeedItem[] = [];

  // 1. Transfers
  try {
    const transfers = await getRecentTransfers(5);
    transfers.forEach((t: any) => {
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
    priceChanges.forEach((c: any) => {
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
    matches.forEach((m: any) => {
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
    results.forEach((m: any) => {
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
 * @param userId - User ID
 * @returns Personalized dashboard data
 */
export async function getUserDashboardData(userId: string | number) {
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
      getLeaderComparison(String(userId)),
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
 * @returns League dashboard data
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
    hotStreaks: (streaks as any)?.hot?.slice(0, 3) || [],
    coldStreaks: (streaks as any)?.cold?.slice(0, 3) || [],
  };
}

/**
 * Get streak data for a specific type
 * @param type - Streak type
 * @param limit - Number of results
 * @returns Streak data
 */
export async function getStreakData(type: 'hot' | 'cold', limit: number = 5) {
  const streaks = await getStreakStats();
  const data = type === 'hot' ? (streaks as any)?.hot : (streaks as any)?.cold;
  return data?.slice(0, limit) || [];
}

/**
 * Get recent activity data for dashboard
 * @param userId - Optional user ID for personalized alerts
 * @returns Recent activity data
 */
export async function getRecentActivityData(userId: string | number | null = null) {
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
