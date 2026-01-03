/**
 * Euroleague Official API Client - V3 (JSON only)
 * Uses the unified api-live.euroleague.net/v3 endpoints
 */

import { CONFIG } from '../config.js';

const API_V3_URL = 'https://api-live.euroleague.net/v3';
const COMPETITION_CODE = 'E'; // EuroLeague

/**
 * Fetch game stats (box score + player info in one call)
 * @param {number} gameCode - Game number in the season (1, 2, 3...)
 * @param {string} season - Season code (e.g., 'E2025')
 * @returns {Promise<Object|null>} Game stats with player data, or null if game doesn't exist
 */
export async function fetchGameStats(gameCode, season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  const url = `${API_V3_URL}/competitions/${COMPETITION_CODE}/seasons/${season}/games/${gameCode}/stats`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null; // Game doesn't exist
      throw new Error(`Euroleague V3 API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching game stats for game ${gameCode}:`, error);
    return null;
  }
}

/**
 * Fetch game report (match metadata: teams, scores, date)
 * @param {number} gameCode - Game number in the season
 * @param {string} season - Season code
 * @returns {Promise<Object|null>} Game report, or null if game doesn't exist
 */
export async function fetchGameReport(gameCode, season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  const url = `${API_V3_URL}/competitions/${COMPETITION_CODE}/seasons/${season}/games/${gameCode}/report`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Euroleague V3 API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching game report for game ${gameCode}:`, error);
    return null;
  }
}

/**
 * Fetch all clubs (teams)
 * @returns {Promise<Array>} Array of club objects
 */
export async function fetchClubs() {
  const url = `${API_V3_URL}/clubs`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Euroleague V3 API error: ${response.status}`);
    }

    const data = await response.json();
    // V3 returns { data: [...] }
    return data.data || data;
  } catch (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }
}

/**
 * Normalize player name for matching between Euroleague and Biwenger
 * Euroleague: "SPAGNOLO, MATTEO" -> Biwenger: "Matteo Spagnolo"
 * @param {string} name - Player name from Euroleague (LASTNAME, FIRSTNAME format)
 * @returns {string} Normalized name for comparison
 */
export function normalizePlayerName(name) {
  if (!name) return '';

  // Euroleague format: "LASTNAME, FIRSTNAME"
  const parts = name.split(',').map((p) => p.trim());

  if (parts.length === 2) {
    // Convert to "Firstname Lastname" format
    const [lastName, firstName] = parts;
    return `${firstName} ${lastName}`.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Fallback: just lowercase and normalize spaces
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Parse V3 game stats into player stats array
 * @param {Object} gameStats - V3 game stats response
 * @returns {Array} Array of player stats objects
 */
export function parseGameStats(gameStats) {
  const allStats = [];

  if (!gameStats) return allStats;

  // V3 has 'local' and 'road' teams
  const teams = [
    { side: 'local', data: gameStats.local },
    { side: 'road', data: gameStats.road },
  ];

  for (const { side, data } of teams) {
    if (!data?.players) continue;

    for (const playerData of data.players) {
      const player = playerData.player;
      const stats = playerData.stats;

      if (!player || !stats) continue;

      // Skip DNP (timePlayed = 0 and all stats are 0)
      if (stats.timePlayed === 0 && stats.points === 0) continue;

      // Parse minutes from timePlayed (in seconds or decimal minutes)
      const minutes = Math.round(stats.timePlayed) || 0;

      allStats.push({
        // Player identification
        euroleague_code: player.person?.code,
        name: player.person?.name,
        team_code: player.club?.code,
        team_name: player.club?.name,

        // Bio data (bonus - V3 includes this!)
        height: player.person?.height,
        weight: player.person?.weight,
        birth_date: player.person?.birthDate,
        position: player.positionName,

        // Stats
        minutes,
        points: stats.points || 0,
        two_points_made: stats.fieldGoalsMade2 || 0,
        two_points_attempted: stats.fieldGoalsAttempted2 || 0,
        three_points_made: stats.fieldGoalsMade3 || 0,
        three_points_attempted: stats.fieldGoalsAttempted3 || 0,
        free_throws_made: stats.freeThrowsMade || 0,
        free_throws_attempted: stats.freeThrowsAttempted || 0,
        rebounds: stats.totalRebounds || 0,
        offensive_rebounds: stats.offensiveRebounds || 0,
        defensive_rebounds: stats.defensiveRebounds || 0,
        assists: stats.assistances || 0,
        steals: stats.steals || 0,
        blocks: stats.blocksFavour || 0,
        turnovers: stats.turnovers || 0,
        fouls_committed: stats.foulsCommited || 0,
        valuation: stats.valuation || 0, // PIR
        plusminus: stats.plusMinus || 0,
      });
    }
  }

  return allStats;
}

/**
 * Extract match info from V3 game stats
 * @param {Object} gameStats - V3 game stats response
 * @returns {Object|null} Match metadata
 */
export function extractMatchInfo(gameStats) {
  if (!gameStats) return null;

  const local = gameStats.local;
  const road = gameStats.road;

  if (!local || !road) return null;

  // Calculate scores from player stats
  const localScore = local.players?.reduce((sum, p) => sum + (p.stats?.points || 0), 0) || 0;
  const roadScore = road.players?.reduce((sum, p) => sum + (p.stats?.points || 0), 0) || 0;

  return {
    homeTeam: local.team?.name || local.club?.name,
    homeCode: local.team?.code || local.club?.code,
    awayTeam: road.team?.name || road.club?.name,
    awayCode: road.team?.code || road.club?.code,
    homeScore: localScore,
    awayScore: roadScore,
    // Game is finished if there are stats
    played: local.players?.length > 0,
  };
}

// ============== LEGACY COMPATIBILITY ==============
// Keep old function names for gradual migration

/**
 * @deprecated Use fetchGameStats instead
 */
export async function fetchBoxScore(gameCode, season) {
  console.warn('fetchBoxScore is deprecated. Use fetchGameStats instead.');
  return fetchGameStats(gameCode, season);
}

/**
 * @deprecated Use fetchGameReport or fetchGameStats instead
 */
export async function fetchGameHeader(gameCode, season) {
  console.warn('fetchGameHeader is deprecated. Use fetchGameReport instead.');
  return fetchGameReport(gameCode, season);
}

/**
 * @deprecated Use fetchClubs instead
 */
export async function fetchTeams(season) {
  console.warn('fetchTeams is deprecated. Use fetchClubs instead.');
  return fetchClubs();
}

/**
 * @deprecated Use parseGameStats instead
 */
export function parseBoxScoreStats(boxscore) {
  console.warn('parseBoxScoreStats is deprecated. Use parseGameStats instead.');
  return parseGameStats(boxscore);
}
