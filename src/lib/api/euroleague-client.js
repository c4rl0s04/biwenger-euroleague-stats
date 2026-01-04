/**
 * Euroleague Official API Client
 * Uses the public live.euroleague.net API endpoints
 */

import { XMLParser } from 'fast-xml-parser';
import { CONFIG } from '../config.js';

const API_V1_URL = CONFIG.EUROLEAGUE.API_V1_URL;
const API_LEGACY_URL = CONFIG.EUROLEAGUE.API_LEGACY_URL;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: true,
});

/**
 * Fetch all teams and their rosters
 * Returns deeply nested structure: { clubs: { club: [ { code: "MAD", name: "Real Madrid", members: { member: [...] } } ] } }
 * @param {string} season - Season code
 * @returns {Promise<Object>} Parsed XML object
 */
export async function fetchTeams(season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  // V1 API uses api-live domain
  const url = `${API_V1_URL}/v1/teams?seasonCode=${season}&competitionCode=E`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Euroleague API error: ${response.status}`);

    const xml = await response.text();
    const result = parser.parse(xml);
    return result;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Fetch season schedule (all games, past and future)
 * @param {string} season - Season code
 * @returns {Promise<Object>} Parsed XML object with schedule
 */
export async function fetchSchedule(season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  const url = `${API_V1_URL}/v1/schedules?seasonCode=${season}&competitionCode=E`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Euroleague API error: ${response.status}`);

    const xml = await response.text();
    const result = parser.parse(xml);

    // Normalize response structure (ensure schedule.item is always an array)
    if (result.schedule && result.schedule.item && !Array.isArray(result.schedule.item)) {
      result.schedule.item = [result.schedule.item];
    }

    return result;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

/**
 * Fetch box score for a game (player stats)
 * @param {number} gameCode - Game number in the season (1, 2, 3...)
 * @param {string} season - Season code (e.g., 'E2024' for 2024-25 Euroleague)
 * @returns {Promise<Object|null>} Box score with player stats, or null if game doesn't exist
 */
export async function fetchBoxScore(gameCode, season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  // Legacy API uses live.euroleague.net domain
  const url = `${API_LEGACY_URL}/Boxscore?gamecode=${gameCode}&seasoncode=${season}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Euroleague API error: ${response.status}`);
    }

    // Check if response is empty (future game)
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null; // Game hasn't been played yet
    }

    // Try to parse as JSON. If it fails, might be an XML error page or empty
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn(`Failed to parse BoxScore JSON for game ${gameCode}:`, text.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error(`Error fetching box score for game ${gameCode}:`, error);
    throw error;
  }
}

/**
 * Fetch game header (metadata: teams, scores, date, round)
 * @param {number} gameCode - Game number in the season
 * @param {string} season - Season code
 * @returns {Promise<Object|null>} Game header info, or null if game doesn't exist
 */
export async function fetchGameHeader(gameCode, season = CONFIG.EUROLEAGUE.SEASON_CODE) {
  // Legacy API uses live.euroleague.net domain
  const url = `${API_LEGACY_URL}/Header?gamecode=${gameCode}&seasoncode=${season}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Euroleague API error: ${response.status}`);
    }

    // Check if response is empty (future game)
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null; // Game hasn't been played yet
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(`Error fetching game header for game ${gameCode}:`, error);
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
 * Parse Euroleague player stats from box score response
 * @param {Object} boxscore - Raw box score response
 * @returns {Array} Array of player stats objects
 */
export function parseBoxScoreStats(boxscore) {
  const allStats = [];

  if (!boxscore?.Stats) return allStats;

  for (const teamStats of boxscore.Stats) {
    const teamCode = teamStats.Team;

    if (!teamStats.PlayersStats) continue;

    for (const player of teamStats.PlayersStats) {
      // Skip DNP (Did Not Play)
      if (player.Minutes === 'DNP') continue;

      // Parse minutes "16:18" -> 16
      let minutes = 0;
      if (player.Minutes && player.Minutes !== 'DNP') {
        const [mins] = player.Minutes.split(':');
        minutes = parseInt(mins) || 0;
      }

      allStats.push({
        euroleague_code: player.Player_ID?.trim(),
        name: player.Player,
        team_code: player.Team,
        team_name: teamCode,
        minutes,
        points: player.Points || 0,
        two_points_made: player.FieldGoalsMade2 || 0,
        two_points_attempted: player.FieldGoalsAttempted2 || 0,
        three_points_made: player.FieldGoalsMade3 || 0,
        three_points_attempted: player.FieldGoalsAttempted3 || 0,
        free_throws_made: player.FreeThrowsMade || 0,
        free_throws_attempted: player.FreeThrowsAttempted || 0,
        rebounds: player.TotalRebounds || 0,
        offensive_rebounds: player.OffensiveRebounds || 0,
        defensive_rebounds: player.DefensiveRebounds || 0,
        assists: player.Assistances || 0,
        steals: player.Steals || 0,
        blocks: player.BlocksFavour || 0,
        turnovers: player.Turnovers || 0,
        fouls_committed: player.FoulsCommited || 0,
        valuation: player.Valuation || 0, // PIR
        plusminus: player.Plusminus || 0,
      });
    }
  }

  return allStats;
}
