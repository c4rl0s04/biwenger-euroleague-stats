import { fetchRoundGames } from '../api/biwenger-client.js';
import { fetchGameHeader, fetchSchedule } from '../api/euroleague-client.js';
import { prepareMatchMutations } from '../db/mutations/matches.js';
import { CONFIG } from '../config.js';

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

  // --- Euroleague Data Setup ---
  // Fetch team codes from DB
  const teams = db.prepare('SELECT id, code FROM teams WHERE code IS NOT NULL').all();
  const teamCodeMap = new Map(teams.map((t) => [t.id, t.code]));

  // Fetch Euroleague Schedule for Game Code mapping
  // Map Key: "HOMECODE_AWAYCODE" -> Value: GameCode
  const gameCodeMap = new Map();
  try {
    const schedule = await fetchSchedule();
    if (schedule && schedule.schedule && schedule.schedule.item) {
      const items = Array.isArray(schedule.schedule.item)
        ? schedule.schedule.item
        : [schedule.schedule.item];
      for (const item of items) {
        if (item.homecode && item.awaycode && item.game) {
          // Keys are lowercase in the parsed XML result
          const codeA = item.homecode.trim();
          const codeB = item.awaycode.trim();
          gameCodeMap.set(`${codeA}_${codeB}`, item.game);
        }
      }
    }
  } catch (err) {
    manager.error(
      `   ⚠️ Failed to fetch EL schedule: ${err.message}. Regular time scores may be missing.`
    );
  }

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

      // Calculate regular time scores (excluding overtime)
      // Try to fetch from Euroleague Header API if match is finished
      let homeScoreRegtime = null;
      let awayScoreRegtime = null;
      let homeQ1 = null,
        awayQ1 = null;
      let homeQ2 = null,
        awayQ2 = null;
      let homeQ3 = null,
        awayQ3 = null;
      let homeQ4 = null,
        awayQ4 = null;
      let homeOT = null,
        awayOT = null;

      if (status === 'finished' && game.id) {
        try {
          // Map Biwenger team IDs to Euroleague codes
          const homeCode = teamCodeMap.get(homeId);
          const awayCode = teamCodeMap.get(awayId);

          if (homeCode && awayCode) {
            // Find game code using Home+Away combination
            const gameKey = `${homeCode}_${awayCode}`;
            const gameCode = gameCodeMap.get(gameKey);

            if (gameCode) {
              const header = await fetchGameHeader(gameCode);

              if (header) {
                // Extract Quarter Scores (Cumulative from API)
                // Keys: ScoreQuarter1A, ScoreQuarter2A, etc.
                const getCumulative = (q, team) => {
                  return parseInt(header[`ScoreQuarter${q}${team}`] ?? 0);
                };

                const hQ1_cum = getCumulative(1, 'A');
                const hQ2_cum = getCumulative(2, 'A');
                const hQ3_cum = getCumulative(3, 'A');
                const hQ4_cum = getCumulative(4, 'A');

                const aQ1_cum = getCumulative(1, 'B');
                const aQ2_cum = getCumulative(2, 'B');
                const aQ3_cum = getCumulative(3, 'B');
                const aQ4_cum = getCumulative(4, 'B');

                // Calculate points per quarter (Delta)
                homeQ1 = hQ1_cum;
                homeQ2 = hQ2_cum - hQ1_cum;
                homeQ3 = hQ3_cum - hQ2_cum;
                homeQ4 = hQ4_cum - hQ3_cum;

                awayQ1 = aQ1_cum;
                awayQ2 = aQ2_cum - aQ1_cum;
                awayQ3 = aQ3_cum - aQ2_cum;
                awayQ4 = aQ4_cum - aQ3_cum;

                // Regular time score is score at end of Q4
                homeScoreRegtime = hQ4_cum;
                awayScoreRegtime = aQ4_cum;

                // OT Score is Total - Regular
                // Use Euroleague provided total scores (ScoreA/ScoreB)
                const totalHome = parseInt(header.ScoreA ?? 0);
                const totalAway = parseInt(header.ScoreB ?? 0);

                if (totalHome > homeScoreRegtime || totalAway > awayScoreRegtime) {
                  homeOT = totalHome - homeScoreRegtime;
                  awayOT = totalAway - awayScoreRegtime;
                } else {
                  homeOT = 0;
                  awayOT = 0;
                }

                manager.log(
                  `      ✅ Found Euroleague data for ${homeCode} vs ${awayCode} (Game ${gameCode}): ${homeScoreRegtime}-${awayScoreRegtime} (Reg) | Q1: ${homeQ1}-${awayQ1}, Q2: ${homeQ2}-${awayQ2}, Q3: ${homeQ3}-${awayQ3}, Q4: ${homeQ4}-${awayQ4}`
                );
              }
            } else {
              manager.log(`      ⚠️  No Euroleague game found for ${homeCode} vs ${awayCode}`);
            }
          }
        } catch (e) {
          manager.error(`      Error fetching EL data: ${e.message}`);
        }
      }

      // If regular time scores not available, use final scores (fallback)
      if (homeScoreRegtime === null) {
        homeScoreRegtime = homeScore;
        awayScoreRegtime = awayScore;
      }

      mutations.upsertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_id: homeId,
        away_id: awayId,
        date: matchDate,
        status: status,
        home_score: homeScore,
        away_score: awayScore,
        home_score_regtime: homeScoreRegtime,
        away_score_regtime: awayScoreRegtime,
        home_q1: homeQ1,
        away_q1: awayQ1,
        home_q2: homeQ2,
        away_q2: awayQ2,
        home_q3: homeQ3,
        away_q3: awayQ3,
        home_q4: homeQ4,
        away_q4: awayQ4,
        home_ot: homeOT,
        away_ot: awayOT,
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
