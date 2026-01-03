import { fetchGameStats, extractMatchInfo } from '../api/euroleague-client.js';

/**
 * Syncs matches (games) for a specific round using Euroleague V3 API.
 * Uses /games/{gameCode}/stats endpoint to get match info.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (unused but kept for signature)
 */
export async function syncMatches(db, round, playersList = {}) {
  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;
  const roundName = round.name;

  // 1. Extract Round Number (e.g. "Jornada 4" -> 4)
  const match = roundName.match(/\d+/);
  if (!match) {
    console.log(`   ⚠️ Skipping match sync for non-numeric round: ${roundName}`);
    return;
  }
  const roundNum = parseInt(match[0]);

  // 2. Calculate Game Codes
  // Formula: (Round - 1) * GamesPerRound + 1
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
  const teams = db.prepare('SELECT id, code, name FROM teams WHERE code IS NOT NULL').all();
  const elCodeToId = new Map();
  teams.forEach((t) => elCodeToId.set(t.code, t.id));

  const insertMatch = db.prepare(`
    INSERT INTO matches (round_id, round_name, home_team, home_id, away_team, away_id, date, status, home_score, away_score)
    VALUES (@round_id, @round_name, @home_team, @home_id, @away_team, @away_id, @date, @status, @home_score, @away_score)
    ON CONFLICT(round_id, home_team, away_team) DO UPDATE SET
      round_name=excluded.round_name,
      status=excluded.status,
      home_score=excluded.home_score,
      away_score=excluded.away_score,
      date=excluded.date
  `);

  let syncedCount = 0;

  for (let code = startCode; code <= endCode; code++) {
    try {
      // Fetch game stats from V3 API
      const gameStats = await fetchGameStats(code);

      if (!gameStats) {
        // Game not found or future game
        continue;
      }

      // Extract match info from V3 response
      const matchInfo = extractMatchInfo(gameStats);

      if (!matchInfo) {
        continue;
      }

      // Map team codes to IDs
      const homeId = elCodeToId.get(matchInfo.homeCode);
      const awayId = elCodeToId.get(matchInfo.awayCode);

      if (!homeId || !awayId) {
        console.warn(
          `      ⚠️ Could not map teams for game ${code}: ${matchInfo.homeCode} vs ${matchInfo.awayCode}`
        );
        continue;
      }

      // Determine game status
      // V3: If we have player stats, game is finished
      const status = matchInfo.played ? 'finished' : 'scheduled';

      insertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_team: matchInfo.homeTeam,
        home_id: homeId,
        away_team: matchInfo.awayTeam,
        away_id: awayId,
        date: null, // V3 game stats doesn't include date, would need /report endpoint
        status: status,
        home_score: matchInfo.homeScore || 0,
        away_score: matchInfo.awayScore || 0,
      });
      syncedCount++;
    } catch (e) {
      console.error(`      Error syncing game ${code}: ${e.message}`);
    }
  }

  console.log(`   -> Synced ${syncedCount} matches from official source.`);
}
