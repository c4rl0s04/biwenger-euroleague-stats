import 'server-only';

/**
 * Player Service
 * Business logic layer for player-related operations
 *
 * @fileoverview Aggregates player data from multiple queries
 */

import {
  getPlayerDetails,
  getTopPlayers,
  getPlayerStreaks,
  getAllPlayers,
  getStatLeaders,
} from '../../db';

// ============ DIRECT WRAPPERS ============

export async function fetchPlayerStreaks(minGames?: number) {
  return await getPlayerStreaks(minGames);
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
 * @param playerId - Player ID
 * @returns Complete player profile or null if not found
 */
export async function getPlayerProfile(playerId: string | number) {
  const player = await getPlayerDetails(playerId);
  if (!player) return null;
  return player;
}

/**
 * Get player performance summary
 * @param playerId - Player ID
 * @returns Performance summary
 */
export async function getPlayerPerformanceSummary(playerId: string | number) {
  const details = await getPlayerDetails(playerId);
  if (!details) return null;

  const { recentMatches = [], advancedStats = {} } = details;
  const recentGames = recentMatches.slice(0, 5);
  const recentAvg =
    recentGames.length > 0
      ? recentGames.reduce((sum: number, m: any) => sum + (m.fantasy_points || 0), 0) /
        recentGames.length
      : 0;

  let formStatus = 'average';
  if (recentAvg >= 20) formStatus = 'excellent';
  else if (recentAvg >= 15) formStatus = 'good';
  else if (recentAvg < 8) formStatus = 'poor';

  return {
    playerId: details.id,
    name: details.name,
    team: (details as any).team,
    recentAverage: Math.round(recentAvg * 10) / 10,
    formStatus,
    gamesPlayed: (details as any).partidos_jugados || 0,
    totalPoints: (details as any).puntos || 0,
    advancedStats,
  };
}

export interface PlayerSearchFilters {
  limit?: number;
}

/**
 * Search players with filters
 * @param filters - Search filters
 * @returns Matching players
 */
export async function searchPlayers(filters: PlayerSearchFilters = {}) {
  const { limit = 20 } = filters;
  // Team/position filtering not available at db level yet
  return await getTopPlayers(limit);
}

/**
 * Get top performers for display
 * @param limit - Number of results
 * @returns Top players
 */
export async function getTopPerformers(limit: number = 10) {
  return await getTopPlayers(limit);
}

/**
 * Fetch statistical leaders for a specific category
 * @param type - 'points', 'rebounds', 'assists', 'valuation'
 * @returns List of top players
 */
export async function fetchStatLeaders(type: string = 'points') {
  return await getStatLeaders(type);
}
