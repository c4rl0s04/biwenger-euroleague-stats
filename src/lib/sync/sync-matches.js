import { fetchRoundGames } from '../api/biwenger-client.js';

/**
 * Syncs matches (games) for a specific round.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (optional)
 */
export async function syncMatches(db, round, playersList = {}) {
  const roundId = round.id;
  const dbRoundId = round.dbId || round.id; // Use mapped ID for DB if present
  const roundName = round.name;

  console.log('Fetching matches...');
  let gamesData = null;
  try {
    // Use score=1 to get standard fantasy points
    gamesData = await fetchRoundGames(roundId);

    if (gamesData.data && gamesData.data.games) {
      const insertMatch = db.prepare(`
                INSERT INTO matches (round_id, round_name, home_team, away_team, date, status, home_score, away_score)
                VALUES (@round_id, @round_name, @home_team, @away_team, @date, @status, @home_score, @away_score)
                ON CONFLICT(round_id, home_team, away_team) DO UPDATE SET
                round_name=excluded.round_name,
                status=excluded.status,
                home_score=excluded.home_score,
                away_score=excluded.away_score,
                date=excluded.date
            `);

      db.transaction(() => {
        for (const game of gamesData.data.games) {
          insertMatch.run({
            round_id: dbRoundId,
            round_name: roundName,
            home_team: game.home.name,
            away_team: game.away.name,
            date: new Date(game.date * 1000).toISOString(),
            status: game.status,
            home_score: game.home.score,
            away_score: game.away.score,
          });
        }
      })();
      console.log(`   -> Synced ${gamesData.data.games.length} matches (schedule/results).`);
    }
  } catch (e) {
    console.error(`   Error fetching games for round ${roundId}: ${e.message}`);
  }
}
