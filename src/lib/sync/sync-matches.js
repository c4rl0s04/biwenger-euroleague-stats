import { fetchRoundGames } from '../biwenger-client.js';

export async function syncMatches(db, round) {
    const roundId = round.id;
    const roundName = round.name;
    
    console.log('Fetching matches...');
    let gamesData = null;
    try {
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
                        round_id: roundId,
                        round_name: roundName,
                        home_team: game.home.name,
                        away_team: game.away.name,
                        date: new Date(game.date * 1000).toISOString(),
                        status: game.status,
                        home_score: game.home.score,
                        away_score: game.away.score
                    });
                }
            })();
            console.log(`   -> Synced ${gamesData.data.games.length} matches.`);
        }
    } catch (e) {
         console.error(`   Error fetching games for round ${roundId}: ${e.message}`);
    }
}
