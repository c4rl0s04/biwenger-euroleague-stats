/**
 * Player Service
 * Business logic layer for player-related operations
 *
 * @fileoverview Aggregates player data from multiple queries
 */

import {
  getPlayerDetails,
  getPlayerRoundHistory,
  getPlayerAdvancedStats,
  getPlayerOwnershipHistory,
  getPlayerPriceHistory,
  getTopPlayersThisSeason,
  getPlayersByTeam,
  getPlayersByPosition,
  getUserSeasonStats,
  getUserRecentRounds,
  getUserSquadDetails,
  getPlayerStreaks,
} from '@/lib/db';

// ============ DIRECT WRAPPERS ============

export function fetchUserSeasonStats(userId) {
  return getUserSeasonStats(userId);
}

export function fetchUserRecentRounds(userId) {
  return getUserRecentRounds(userId);
}

export function fetchUserSquadDetails(userId) {
  return getUserSquadDetails(userId);
}

export function fetchPlayerStreaks(playerId) {
  return getPlayerStreaks(playerId);
}

export function fetchPlayerRoundHistory(playerId) {
  return getPlayerRoundHistory(playerId);
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get complete player profile data
 * @param {number|string} playerId - Player ID
 * @returns {Object|null} Complete player profile or null if not found
 */
export function getPlayerProfile(playerId) {
  const player = getPlayerDetails(playerId);
  if (!player) return null;
  return player;
}

/**
 * Get player performance summary
 * @param {number|string} playerId - Player ID
 * @returns {Object} Performance summary
 */
export function getPlayerPerformanceSummary(playerId) {
  const details = getPlayerDetails(playerId);
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
 * @returns {Array} Matching players
 */
export function searchPlayers(filters = {}) {
  const { team, position, limit = 20 } = filters;

  if (team) return getPlayersByTeam(team);
  if (position) return getPlayersByPosition(position);
  return getTopPlayersThisSeason(limit);
}

/**
 * Get top performers for display
 * @param {number} [limit=10] - Number of results
 * @returns {Array} Top players
 */
export function getTopPerformers(limit = 10) {
  return getTopPlayersThisSeason(limit);
}
