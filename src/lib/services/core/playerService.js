/**
 * Player Service
 * Business logic layer for player-related operations
 *
 * @fileoverview Aggregates player data from multiple queries
 */

import {
  getPlayerDetails,
  getTopPlayers,
  getTopPlayersByForm,
  getPlayerStreaks,
  getPlayersBirthday,
  getAllPlayers,
  getStatLeaders, // Added missing import
} from '@/lib/db';

// ============ DIRECT WRAPPERS ============

export async function fetchPlayerStreaks(playerId) {
  return await getPlayerStreaks(playerId);
}

/**
 * Fetch all players in the system
 */
export async function fetchAllPlayers() {
  return await getAllPlayers();
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get complete player profile data
 * @param {number|string} playerId - Player ID
 * @returns {Promise<Object|null>} Complete player profile or null if not found
 */
export async function getPlayerProfile(playerId) {
  const player = await getPlayerDetails(playerId);
  if (!player) return null;
  return player;
}

/**
 * Get player performance summary
 * @param {number|string} playerId - Player ID
 * @returns {Promise<Object>} Performance summary
 */
export async function getPlayerPerformanceSummary(playerId) {
  const details = await getPlayerDetails(playerId);
  if (!details) return null;

  const { recentMatches = [], advancedStats = {} } = details;
  const recentGames = recentMatches.slice(0, 5);
  const recentAvg =
    recentGames.length > 0
      ? recentGames.reduce((sum, m) => sum + (m.fantasy_points || 0), 0) / recentGames.length
      : 0;

  let formStatus = 'average';
  if (recentAvg >= 20) formStatus = 'excellent';
  else if (recentAvg >= 15) formStatus = 'good';
  else if (recentAvg < 8) formStatus = 'poor';

  return {
    playerId: details.id,
    name: details.name,
    team: details.team,
    recentAverage: Math.round(recentAvg * 10) / 10,
    formStatus,
    gamesPlayed: details.partidos_jugados || 0,
    totalPoints: details.puntos || 0,
    advancedStats,
  };
}

/**
 * Search players with filters
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Matching players
 */
export async function searchPlayers(filters = {}) {
  const { limit = 20 } = filters;
  // Team/position filtering not available at db level yet
  return await getTopPlayers(limit);
}

/**
 * Get top performers for display
 * @param {number} [limit=10] - Number of results
 * @returns {Promise<Array>} Top players
 */
export async function getTopPerformers(limit = 10) {
  return await getTopPlayers(limit);
}

/**
 * Fetch statistical leaders for a specific category
 * @param {string} type - 'points', 'rebounds', 'assists', 'valuation'
 * @returns {Promise<Array>} List of top players
 */
export async function fetchStatLeaders(type = 'points') {
  return await getStatLeaders(type);
}
