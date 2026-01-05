import { fetchRoundGames } from '../api/biwenger-client.js';
import { prepareMatchMutations } from '../db/mutations/matches.js';

/**
 * Syncs matches (games) for a specific round using Biwenger API.
 * Uses fetchRoundGames to retrieve match schedule, scores, and status.
 *
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (unused explicitly but kept for signature consistency)
 */
/**
 * Syncs matches (games) for a specific round using Biwenger API.
 * Uses fetchRoundGames to retrieve match schedule, scores, and status.
 *
 * @param {import('./manager').SyncManager} manager
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (unused explicitly but kept for signature consistency)
 */
export async function run(manager, round, playersList = {}) {
  const db = manager.context.db;
  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;
  const roundName = round.name;

  manager.log(`   🌍 Syncing Matches for Round ${roundName} (using Biwenger API)...`);

  let gamesData;
  try {
    gamesData = await fetchRoundGames(roundId);
  } catch (e) {
    manager.error(`   ❌ Error fetching games for round ${roundId}: ${e.message}`);
    return { success: false, message: e.message, error: e };
  }

  // Check the structure based on inspection:
  // It seems games can be in root 'games' array or 'data.games'.
  // Based on inspection output for Round 2, it was inside 'next.games' but fetchRoundGames likely returns the specific round data directly.
  // Let's assume fetchRoundGames(roundId) returns the object containing 'data.games' or 'games'.
  // Our inspect-biwenger-keys.js output showed:
  // "Top level keys: [ 'data' ]" -> "data keys: [ 'score', 'games', ... ]"
  // So the structure is likely response.data.games
  // However, the helper might unwrap it? Let's check biwenger-client.js
  // fetchRoundGames just calls biwengerFetch, which returns response.json().
  // So likely: response.data.games

  let games = [];
  if (gamesData.data && Array.isArray(gamesData.data.games)) {
    games = gamesData.data.games;
  } else if (Array.isArray(gamesData.games)) {
    games = gamesData.games;
  } else {
    // Maybe checking 'content' or other fields?
    // Based on previous step 118 output: "Found 10 games in data.games" (deduced from context, actually step 118 didn't show logs but implied success).
    // wait, step 114 output showed "data keys: ... games". So yes, gamesData.data.games.
    manager.error(`   ⚠️ No 'games' array found in response for round ${roundId}`);
    // return { success: false, message: 'No games array found' }; // Optional: suppress error return if we want to continue
    return { success: true, message: `No matches found for round ${roundName}`, data: [] };
  }

  if (games.length === 0) {
    manager.log(`   ⚠️ No games found for Round ${roundName}`);
    return { success: true, message: `No games`, data: [] };
  }

  manager.log(`   -> Found ${games.length} games.`);

  // Prepare DB mutations
  const mutations = prepareMatchMutations(db);
  let syncedCount = 0;

  for (const game of games) {
    try {
      // Map Teams
      // Biwenger returns objects: { id, name, slug, score }
      const homeTeam = game.home;
      const awayTeam = game.away;

      if (!homeTeam || !awayTeam) {
        manager.log(`      ⚠️ Missing team data for game ${game.id}`);
        continue;
      }

      // Safe IDs
      const homeId = homeTeam.id;
      const awayId = awayTeam.id;

      // Status Mapping
      // Biwenger status: 'finished', 'pending', 'playing'?
      // We map to: 'finished', 'scheduled', 'live'
      let status = 'scheduled';
      if (game.status === 'finished') {
        status = 'finished';
      } else if (game.status === 'playing' || game.status === 'live') {
        status = 'live';
      }

      // Date Handling
      // Biwenger returns unix timestamp (seconds) in 'date' field
      let matchDate = null;
      if (game.date) {
        matchDate = new Date(game.date * 1000).toISOString();
      }

      const homeScore = typeof homeTeam.score === 'number' ? homeTeam.score : 0;
      const awayScore = typeof awayTeam.score === 'number' ? awayTeam.score : 0;

      mutations.upsertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_id: homeId,
        away_id: awayId,
        date: matchDate,
        status: status,
        home_score: homeScore,
        away_score: awayScore,
      });

      syncedCount++;
    } catch (e) {
      manager.error(`      Error syncing game ${game.id}: ${e.message}`);
    }
  }

  // manager.log(`   -> Synced ${syncedCount} matches.`);
  return { success: true, message: `Synced ${syncedCount} matches for ${roundName}.`, data: games };
}

// Legacy export
export const syncMatches = async (db, round, playersList) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  return run(mockManager, round, playersList);
};
