import { fetchRoundGames } from '../biwenger-client.js';

/**
 * Syncs matches (games) for a specific round.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 */
/**
 * Syncs matches (games) for a specific round.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object (id, name, status)
 * @param {Object} playersList - Map of player IDs to player objects (optional)
 */
export async function syncMatches(db, round, playersList = {}) {
    const roundId = round.id;
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

            const insertStats = db.prepare(`
                INSERT INTO player_round_stats (
                    player_id, round_id, fantasy_points, minutes, points,
                    two_points_made, two_points_attempted,
                    three_points_made, three_points_attempted,
                    free_throws_made, free_throws_attempted,
                    rebounds, assists, steals, blocks, turnovers, fouls_committed
                ) VALUES (
                    @player_id, @round_id, @fantasy_points, @minutes, @points,
                    @two_points_made, @two_points_attempted,
                    @three_points_made, @three_points_attempted,
                    @free_throws_made, @free_throws_attempted,
                    @rebounds, @assists, @steals, @blocks, @turnovers, @fouls_committed
                )
                ON CONFLICT(player_id, round_id) DO UPDATE SET
                    fantasy_points=excluded.fantasy_points,
                    minutes=excluded.minutes,
                    points=excluded.points,
                    two_points_made=excluded.two_points_made,
                    two_points_attempted=excluded.two_points_attempted,
                    three_points_made=excluded.three_points_made,
                    three_points_attempted=excluded.three_points_attempted,
                    free_throws_made=excluded.free_throws_made,
                    free_throws_attempted=excluded.free_throws_attempted,
                    rebounds=excluded.rebounds,
                    assists=excluded.assists,
                    steals=excluded.steals,
                    blocks=excluded.blocks,
                    turnovers=excluded.turnovers,
                    fouls_committed=excluded.fouls_committed
            `);

            // Helper to insert unknown players on the fly
            const insertPlayer = db.prepare(`
              INSERT INTO players (
                id, name, team, position, 
                puntos, partidos_jugados, 
                played_home, played_away, 
                points_home, points_away, points_last_season
              ) 
              VALUES (
                @id, @name, @team, @position, 
                @puntos, @partidos_jugados, 
                @played_home, @played_away, 
                @points_home, @points_away, @points_last_season
              )
              ON CONFLICT(id) DO NOTHING
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

                    // Process Player Stats (Reports)
                    const processReports = (reports) => {
                        if (!reports) return;
                        for (const [key, report] of Object.entries(reports)) {
                            // The key is just an index (0, 1, 2...), the real ID is in report.player.id
                            const playerId = report.player ? report.player.id : parseInt(key);
                            
                            // Check if player exists, insert placeholder if not
                            if (!playersList[playerId]) {
                                // console.warn(`   Skipping stats for unknown player ${playerId} (${report.player ? report.player.name : 'No Name'})`);
                                continue; // Skip processing stats for this unknown player
                            }

                            const statsMap = {};
                            if (report.stats) {
                                for (const [label, value] of report.stats) {
                                    statsMap[label] = value;
                                }
                            }

                            const parseShooting = (val) => {
                                if (!val) return { made: 0, attempted: 0 };
                                // Format: "1/5 (20%)" or "-1/-5 (20%)"
                                // Remove negative signs if present (formatting artifact?)
                                const cleanVal = val.toString().replace(/-/g, '');
                                const parts = cleanVal.split(' ')[0].split('/');
                                return {
                                    made: parseInt(parts[0]) || 0,
                                    attempted: parseInt(parts[1]) || 0
                                };
                            };

                            const twoPt = parseShooting(statsMap['2-point field goals']);
                            const threePt = parseShooting(statsMap['3 pointers']);
                            const ft = parseShooting(statsMap['Free throws']);

                            insertStats.run({
                                player_id: playerId,
                                round_id: roundId,
                                fantasy_points: report.points || 0,
                                minutes: parseInt(statsMap['Minutes played']) || 0,
                                points: parseInt(statsMap['Points']) || 0,
                                two_points_made: twoPt.made,
                                two_points_attempted: twoPt.attempted,
                                three_points_made: threePt.made,
                                three_points_attempted: threePt.attempted,
                                free_throws_made: ft.made,
                                free_throws_attempted: ft.attempted,
                                rebounds: parseInt(statsMap['Rebounds']) || 0,
                                assists: parseInt(statsMap['Assists']) || 0,
                                steals: parseInt(statsMap['Tackles']) || 0, // Mapping Tackles to Steals
                                blocks: parseInt(statsMap['Blocks']) || 0,
                                turnovers: parseInt(statsMap['Turnovers']) || 0,
                                fouls_committed: parseInt(statsMap['Fouls committed']) || 0
                            });
                        }
                    };

                    processReports(game.home.reports);
                    processReports(game.away.reports);
                }
            })();
            console.log(`   -> Synced ${gamesData.data.games.length} matches and player stats.`);
        }
    } catch (e) {
         console.error(`   Error fetching games for round ${roundId}: ${e.message}`);
    }
}
