/**
 * Biwenger API Client (Unofficial)
 * 
 * This client interacts with the Biwenger API to fetch data for the application.
 * Since this is an unofficial API, we need to be careful with headers and rate limiting.
 * 
 * REQUIRED CONFIGURATION:
 * You must provide the following environment variables or hardcoded values:
 * - BIWENGER_TOKEN: The Bearer token (found in Authorization header)
 * - BIWENGER_LEAGUE_ID: The ID of your league (found in X-League header or URL)
 * - BIWENGER_ACCOUNT_ID: (Optional) Sometimes required in headers
 */

const BASE_URL = 'https://biwenger.as.com/api/v2';

/**
 * Generic fetch wrapper with headers
 */
export async function biwengerFetch(endpoint) {
  // Read config lazily to ensure env vars are loaded
  const tokenRaw = process.env.BIWENGER_TOKEN;
  const leagueId = process.env.BIWENGER_LEAGUE_ID;
  const userId = process.env.BIWENGER_USER_ID;

  if (!tokenRaw) {
    throw new Error('BIWENGER_TOKEN is missing in environment variables');
  }
  if (!leagueId) {
    throw new Error('BIWENGER_LEAGUE_ID is missing in environment variables');
  }

  const url = `${BASE_URL}${endpoint}`;
  
  // Handle token prefix
  const token = tokenRaw.startsWith('Bearer ') ? tokenRaw : `Bearer ${tokenRaw}`;

  const headers = {
    'Authorization': token,
    'X-League': leagueId,
    'X-User': userId,
    'Accept': 'application/json, text/plain, */*'
  };
  console.log(`Fetching: ${url}`);
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Biwenger API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}
/**
 * Helper to get League ID lazily
 */
function getLeagueId() {
  const id = process.env.BIWENGER_LEAGUE_ID;
  if (!id) throw new Error('BIWENGER_LEAGUE_ID is missing');
  return id;
}

/**
 * Get Market Data (Players for sale)
 */
export async function fetchMarket() {
  return biwengerFetch(`/league/${getLeagueId()}/market`);
}

/**
 * Get League Details (Standings, settings)
 */
export async function fetchLeague() {
  return biwengerFetch(`/league/${getLeagueId()}?fields=standings`);
}

/**
 * Get All Players in the League (Squads)
 */
export async function fetchBoard() {
  return biwengerFetch(`/league/${getLeagueId()}/board`);
}

/**
 * Get Transfers (Fichajes)
 * @param {number} offset - Pagination offset
 * @param {number} limit - Number of results
 */
export async function fetchTransfers(offset = 0, limit = 20) {
  return biwengerFetch(`/league/${getLeagueId()}/board?type=transfer&offset=${offset}&limit=${limit}`);
}

/**
 * Get Competition Data (e.g. Euroleague)
 */
export async function fetchCompetition(id = 'euroleague') {
  return biwengerFetch(`/competitions/${id}`);
}

/**
 * Get All Players (Database of all players in the game)
 */
export async function fetchAllPlayers() {
  return biwengerFetch(`/competitions/euroleague/data?lang=es`); 
}

/**
 * Get Rounds League Data (Standings with lineups)
 * @param {number|string} [roundId] - Optional round ID to fetch specific round
 */
export async function fetchRoundsLeague(roundId) {
  const endpoint = roundId ? `/rounds/league/${roundId}` : `/rounds/league`;
  return biwengerFetch(endpoint);
}
