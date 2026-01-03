import { fetchGameHeader } from '../api/euroleague-client.js';

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
  const metaRow = db.prepare('SELECT value FROM sync_meta WHERE key = ?').get('euroleague_team_count');
  const teamCount = metaRow ? parseInt(metaRow.value) : 20;
  const gamesPerRound = Math.floor(teamCount / 2);

  const startCode = (roundNum - 1) * gamesPerRound + 1;
  const endCode = startCode + gamesPerRound - 1;

  console.log(`   🌍 Syncing Matches (Euroleague Games ${startCode}-${endCode}, ${teamCount} teams)...`);

  // 3. Prepare DB
  // Get Map of Euroleague Code -> Biwenger Team ID
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
      // Biwenger: 'finished', 'scheduled'
      // Euroleague: Live=true/false. If scores present and Live=false -> finished.
      let status = 'scheduled';
      if (game.Live) status = 'live';
      else if (game.ScoreA !== null && game.ScoreB !== null) status = 'finished';

      // Date parsing
      // game.Date format might be custom string or ISO. Client header usually has "Date": "23/10/2025" + "Time": "20:30"
      // or "Date": "2025-10-23T20:30:00"
      // Let's assume it needs standardizing. fetchGameHeader returns raw JSON.
      // We might need to inspect the format.
      // Safe fallback: new Date(game.Date)

      insertMatch.run({
        round_id: dbRoundId,
        round_name: roundName,
        home_team: game.TeamAName || homeCode, // Use Name if available
        home_id: homeId,
        away_team: game.TeamBName || awayCode,
        away_id: awayId,
        date: game.Date, // Warning: Verify format
        status: status,
        home_score: game.ScoreA,
        away_score: game.ScoreB,
      });
      syncedCount++;
    } catch (e) {
      console.error(`      Error syncing game ${code}: ${e.message}`);
    }
  }

  console.log(`   -> Synced ${syncedCount} matches from official source.`);
}
