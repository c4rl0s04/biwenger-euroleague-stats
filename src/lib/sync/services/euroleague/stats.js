import {
  fetchBoxScore,
  fetchGameHeader,
  parseBoxScoreStats,
  normalizePlayerName,
} from '../../../api/euroleague-client.js';
import { CONFIG } from '../../../config.js';
import { prepareEuroleagueMutations } from '../../../db/mutations/euroleague.js';
import { calculateRegularTimeScores } from '../../../utils/match-scores.js';
import { prepareMatchMutations } from '../../../db/mutations/matches.js';

const CURRENT_SEASON = CONFIG.EUROLEAGUE.SEASON_CODE;

/**
 * Syncs game stats from Euroleague official API.
 * This replaces the old Biwenger stats sync for more accurate data.
 *
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {number} gameCode - Euroleague game code (1, 2, 3...)
 * @param {number} roundId - Round ID for our database
 * @param {string} roundName - Round name
 * @param {Object} options - { activeOnly: boolean }
 */
/**
 * Syncs game stats from Euroleague official API.
 * This replaces the old Biwenger stats sync for more accurate data.
 *
 * @param {import('./manager').SyncManager} manager
 * @param {number} gameCode - Euroleague game code (1, 2, 3...)
 * @param {number} roundId - Round ID for our database
 * @param {string} roundName - Round name
 * @param {Object} options - { activeOnly: boolean }
 */
export async function runGame(manager, gameCode, roundId, roundName, options = {}) {
  const db = manager.context.db;
  manager.log(`📊 Syncing Euroleague game ${gameCode} for round ${roundId}...`);

  // Initialize Mutations
  const mutations = prepareEuroleagueMutations(db);

  // OPTIMIZATION: If activeOnly is set, check if we already have a FINAL result for this game
  if (options.activeOnly) {
    // const existingMatch = mutations.checkFinishedMatch.get(roundId, 'UNKNOWN_TEAM', 'UNKNOWN_TEAM');
    // The above query is tricky because we don't know the Team ID or Code yet without fetching header.
    // However, we can check by ROUND and DATE if we TRUST the schedule.
    // Better approach: Let's fetch the header (cheap call) then decide if we fetch the BOXSCORE (expensive/heavy parsing).
  }

  try {
    // 1. Fetch game header to check if game exists and is finished
    const header = await fetchGameHeader(gameCode, CURRENT_SEASON);

    if (!header || !header.TeamA) {
      manager.log(`   ⚠️ Game ${gameCode} has no data yet`);
      return { success: false, reason: 'no_data' };
    }

    // Note: matches table is now populated by sync-matches.js only
    // This function only handles player_round_stats

    // 3. Fetch box score with player stats
    const boxscore = await fetchBoxScore(gameCode, CURRENT_SEASON);

    // Handle future games with no stats yet
    if (!boxscore) {
      manager.log(`   ⏭️ Game ${gameCode} has no box score yet (future game)`);
      return { success: true, reason: 'no_boxscore_yet' };
    }

    const playerStats = parseBoxScoreStats(boxscore);

    if (playerStats.length === 0) {
      manager.log(`   ⚠️ No player stats for game ${gameCode}`);
      return { success: false, reason: 'no_stats' };
    }

    // 4. Get player ID mapping (euroleague_code -> biwenger id)
    // Also prepare fallback: find by name similarity
    const allPlayers = mutations.getAllPlayers.all();

    // Build normalized name lookup
    const playerNameMap = new Map();
    for (const p of allPlayers) {
      const normalized = normalizePlayerName(p.name);
      playerNameMap.set(normalized, p);
    }

    // Prepare update statements - Using mutations module now

    let matched = 0;
    let unmatched = 0;

    db.transaction(() => {
      for (const stat of playerStats) {
        let playerId = null;

        // Try to find by euroleague_code first
        const existing = mutations.getPlayerByEuroleagueCode.get(stat.euroleague_code);
        if (existing) {
          playerId = existing.id;
        } else {
          // Fallback: find by normalized name
          const normalizedName = normalizePlayerName(stat.name);
          const matchedPlayer = playerNameMap.get(normalizedName);

          if (matchedPlayer) {
            playerId = matchedPlayer.id;
            // Save the mapping for future lookups
            mutations.updatePlayerEuroleagueCode.run({
              euroleague_code: stat.euroleague_code,
              id: playerId,
            });
          }
        }

        if (!playerId) {
          unmatched++;
          // console.log(`   ⚠️ Could not match player: ${stat.name} (${stat.euroleague_code})`);
          continue;
        }

        matched++;

        // Insert stats (fantasy_points will be 0, updated later from Biwenger)
        mutations.insertPlayerStats.run({
          player_id: playerId,
          round_id: roundId,
          fantasy_points: 0, // Will be updated from Biwenger
          minutes: stat.minutes,
          points: stat.points,
          two_points_made: stat.two_points_made,
          two_points_attempted: stat.two_points_attempted,
          three_points_made: stat.three_points_made,
          three_points_attempted: stat.three_points_attempted,
          free_throws_made: stat.free_throws_made,
          free_throws_attempted: stat.free_throws_attempted,
          rebounds: stat.rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls_committed: stat.fouls_committed,
          valuation: stat.valuation,
        });
      }
    })();

    manager.log(`   ✅ Game ${gameCode}: ${matched} players matched, ${unmatched} unmatched`);
    return { success: true, matched, unmatched };
  } catch (error) {
    manager.error(`   ❌ Error syncing game ${gameCode}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Legacy export
export const syncEuroleagueGameStats = async (db, gameCode, roundId, roundName, options) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  };
  return runGame(mockManager, gameCode, roundId, roundName, options);
};

/**
 * Sync fantasy points from Biwenger (to be called after Euroleague stats sync)
 * Updates the fantasy_points column for player_round_stats
 */
/**
 * Sync fantasy points from Biwenger (to be called after Euroleague stats sync)
 * Updates the fantasy_points column for player_round_stats
 * @param {import('./manager').SyncManager} manager
 * @param {Object} round
 * @param {Object} playersListInput
 */
export async function runBiwengerPoints(manager, round, playersListInput) {
  const db = manager.context.db;
  const playersList = playersListInput || manager.context.playersList || {};

  // Import dynamically to avoid circular dependencies
  const { fetchRoundGames } = await import('../../../api/biwenger-client.js');
  // Reuse mutations module (or initialize new one if db scope is different, here we assume db is passed)
  const mutations = prepareEuroleagueMutations(db);

  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;

  manager.log(`💫 Syncing Biwenger fantasy points for round ${roundId}...`);

  try {
    const gamesData = await fetchRoundGames(roundId);

    if (!gamesData?.data?.games) {
      manager.log('   ⚠️ No games data from Biwenger');
      return { success: false, message: 'No games data' };
    }

    let updated = 0;

    db.transaction(() => {
      for (const game of gamesData.data.games) {
        const processReports = (reports) => {
          if (!reports) return;
          for (const [, report] of Object.entries(reports)) {
            const playerId = report.player?.id;
            if (!playerId || !playersList[playerId]) continue;

            const result = mutations.updateFantasyPoints.run({
              fantasy_points: report.points || 0,
              player_id: playerId,
              round_id: dbRoundId,
            });

            if (result.changes > 0) updated++;
          }
        };

        processReports(game.home.reports);
        processReports(game.away.reports);
      }
    })();

    manager.log(`   ✅ Updated fantasy points for ${updated} players`);
    return { success: true, updated };
  } catch (error) {
    manager.error(`   ❌ Error syncing fantasy points:`, error.message);
    return { success: false, error: error.message };
  }
}

// Legacy export
export const syncBiwengerFantasyPoints = async (db, round, playersList) => {
  const mockManager = {
    context: { db, playersList: playersList || {} },
    log: console.log,
    error: console.error,
  };
  return runBiwengerPoints(mockManager, round, playersList);
};
