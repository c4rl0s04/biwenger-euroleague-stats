import { fetchGameHeader, fetchSchedule } from '../api/euroleague-client.js';
import { prepareMatchMutations } from '../db/mutations/matches.js';

/**
 * Syncs matches (games) for a specific round using Euroleague Official Data.
 * Hybrid Approach: matches Euroleague games to Biwenger Rounds.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (unused but kept for signature)
 */
export async function syncMatches(db, round, playersList = {}) {
  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;
  const roundName = round.name;

  // 1. Extract Round Number (e.g. "Jornada 4" -> 4)
  // handle "Playoffs", "Final Four" later if needed. For now assume Regular Season.
  const match = roundName.match(/\d+/);
  if (!match) {
    console.log(`   ⚠️ Skipping match sync for non-numeric round: ${roundName}`);
    return;
  }
  const roundNum = parseInt(match[0]);

  console.log(`   🌍 Syncing Matches for Round ${roundNum} (fetching full schedule)...`);

  // 2. Fetch Schedule
  let scheduleData;
  try {
    scheduleData = await fetchSchedule();
  } catch (e) {
    console.error(`   ❌ Error fetching schedule: ${e.message}`);
    return;
  }

  const allGames = scheduleData?.schedule?.item || [];

  // Filter games for this round
  // The API returns 'gameday' as the round number for Regular Season
  const roundGames = allGames.filter((g) => parseInt(g.gameday) === roundNum);

  if (roundGames.length === 0) {
    console.log(`   ⚠️ No games found in schedule for Round ${roundNum}`);
    return;
  }

  console.log(`   -> Found ${roundGames.length} games for Round ${roundNum}`);

  // 3. Prepare DB
  // Get Map of Euroleague Code -> Biwenger Team ID
  const mutations = prepareMatchMutations(db);
  const teams = mutations.getMappedTeams.all();
  const elCodeToId = new Map();
  teams.forEach((t) => elCodeToId.set(t.code, t.id));

  let syncedCount = 0;

  for (const game of roundGames) {
    // Extract Game Code Number (e.g. "E2025_370" -> 370)
    const gameCodeStr = game.gamecode || '';
    const codeParts = gameCodeStr.split('_');
    const gameCode = codeParts.length > 1 ? parseInt(codeParts[1]) : parseInt(game.game);

    if (!gameCode) {
      console.warn(`      ⚠️ Could not parse game code: ${gameCodeStr}`);
      continue;
    }

    try {
      // Basic info from Schedule
      const homeCode = game.homecode;
      const awayCode = game.awaycode;
      const homeId = elCodeToId.get(homeCode);
      const awayId = elCodeToId.get(awayCode);

      if (!homeId || !awayId) {
        console.warn(
          `      ⚠️ Could not map teams for game ${gameCode}: ${homeCode} vs ${awayCode}`
        );
        continue;
      }

      let status = 'scheduled';
      let scoreA = 0;
      let scoreB = 0;
      let matchDate = game.date; // "Sep 30, 2025" or similar format

      // Parse date to YYYY-MM-DDTHH:mm:ss
      // Schedule date format is usually "Mmm DD, YYYY" (e.g. "Oct 03, 2025")
      // Start time is "HH:mm" (e.g. "18:45")
      if (matchDate) {
        const dateObj = new Date(matchDate);
        if (!isNaN(dateObj.getTime())) {
          const datePart = dateObj.toISOString().split('T')[0];
          const timePart = game.startime ? `${game.startime}:00` : '00:00:00';
          matchDate = `${datePart}T${timePart}`;
        }
      }

      // If game is played, try to fetch details only for scores
      // (Schedule XML doesn't include scores usually)
      if (game.played === true || game.played === 'true') {
        try {
          const detailedGame = await fetchGameHeader(gameCode);
          if (detailedGame) {
            if (detailedGame.Live === true) status = 'live';
            else if (detailedGame.GameTime && detailedGame.GameTime !== '00:00')
              status = 'finished';

            scoreA = parseInt(detailedGame.ScoreA) || 0;
            scoreB = parseInt(detailedGame.ScoreB) || 0;

            // Use more precise date/time if available?
            // Keep schedule date as primary source for consistency unless missing
          } else {
            // fallback if detailed fetch fails but schedule says played
            status = 'finished';
          }
        } catch (detailErr) {
          console.warn(
            `      ⚠️ Failed to fetch details for played game ${gameCode}, using schedule defaults. ${detailErr.message}`
          );
          status = 'finished'; // Assume finished if schedule says played
        }
      }

      mutations.upsertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_team: game.hometeam || homeCode, // Use name if available
        home_id: homeId,
        away_team: game.awayteam || awayCode,
        away_id: awayId,
        date: matchDate,
        status: status,
        home_score: scoreA,
        away_score: scoreB,
      });
      syncedCount++;
    } catch (e) {
      console.error(`      Error syncing game ${gameCode}: ${e.message}`);
    }
  }

  console.log(`   -> Synced ${syncedCount} matches from official source.`);
}
