import { fetchGameHeader } from '../api/euroleague-client.js';
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

  // 2. Calculate Game Codes
  // Formula: (Round - 1) * GamesPerRound + 1

  // Get team count from sync_meta (set by syncEuroleagueMaster), fallback to 20
  const metaRow = db
    .prepare('SELECT value FROM sync_meta WHERE key = ?')
    .get('euroleague_team_count');
  const teamCount = metaRow ? parseInt(metaRow.value) : 20;
  const gamesPerRound = Math.floor(teamCount / 2);

  const startCode = (roundNum - 1) * gamesPerRound + 1;
  const endCode = startCode + gamesPerRound - 1;

  console.log(
    `   🌍 Syncing Matches (Euroleague Games ${startCode}-${endCode}, ${teamCount} teams)...`
  );

  // 3. Prepare DB
  // Get Map of Euroleague Code -> Biwenger Team ID
  const mutations = prepareMatchMutations(db);
  const teams = mutations.getMappedTeams.all();
  const elCodeToId = new Map();
  teams.forEach((t) => elCodeToId.set(t.code, t.id));

  let syncedCount = 0;

  for (let code = startCode; code <= endCode; code++) {
    try {
      const game = await fetchGameHeader(code);

      if (!game) {
        // console.log(`      Game ${code} not found/future.`);
        continue;
      }

      // Map Teams
      // API returns: TeamA (Name), CodeTeamA (Code)
      // We must use CodeTeamA to map to our DB's 'euroleague_code'

      const homeCode = game.CodeTeamA;
      const awayCode = game.CodeTeamB;
      const homeId = elCodeToId.get(homeCode);
      const awayId = elCodeToId.get(awayCode);

      if (!homeId || !awayId) {
        console.warn(`      ⚠️ Could not map teams for game ${code}: ${homeCode} vs ${awayCode}`);
        continue;
      }

      // Status mapping
      // EuroLeague API returns:
      // - Live: true/false (is game currently being played)
      // - GameTime: "40:00" when finished (full game = 40 min), "00:00" for future
      // - ScoreA/ScoreB: scores (can be "0" for unplayed games)
      let status = 'scheduled';
      if (game.Live === true) {
        status = 'live';
      } else if (game.GameTime && game.GameTime !== '00:00') {
        // Game has been played (GameTime > 0)
        status = 'finished';
      }

      // Date parsing - API returns "DD/MM/YYYY" format
      let matchDate = game.Date;
      if (matchDate && matchDate.includes('/')) {
        const [day, month, year] = matchDate.split('/');
        matchDate = `${year}-${month}-${day}`;
      }

      mutations.upsertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_team: game.TeamA || homeCode,
        home_id: homeId,
        away_team: game.TeamB || awayCode,
        away_id: awayId,
        date: matchDate,
        status: status,
        home_score: parseInt(game.ScoreA) || 0,
        away_score: parseInt(game.ScoreB) || 0,
      });
      syncedCount++;
    } catch (e) {
      console.error(`      Error syncing game ${code}: ${e.message}`);
    }
  }

  console.log(`   -> Synced ${syncedCount} matches from official source.`);
}
