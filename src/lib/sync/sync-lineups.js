import { fetchRoundsLeague } from '../biwenger-client.js';

/**
 * Syncs lineups for finished rounds.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object
 * @param {Set<number>} existingLineupRounds - Set of round IDs already synced
 * @param {number} lastLineupRoundId - ID of the last synced round
 * @param {Object} playersList - Map of player IDs to player objects
 * @returns {Promise<number>} - Number of lineups inserted
 */
export async function syncLineups(db, round, existingLineupRounds, lastLineupRoundId, playersList) {
    const roundId = round.id;
    const roundName = round.name;
    const status = round.status;
    let insertedCount = 0;

    if (status === 'finished' || status === 'active') {
         console.log('Fetching lineups/standings...');
         
         // Fetch round details to get standings
         let standings = null;
         try {
             const roundData = await fetchRoundsLeague(roundId);
             if (roundData.data) {
                if (roundData.data.round && roundData.data.round.standings) {
                    standings = roundData.data.round.standings;
                } else if (roundData.data.league && roundData.data.league.standings) {
                    standings = roundData.data.league.standings;
                }
             }
         } catch (e) {
             console.error(`Error fetching round details for ${roundId}: ${e.message}`);
         }

         if (standings) {
             const insertUser = db.prepare(`
               INSERT OR IGNORE INTO users (id, name) VALUES (@id, @name)
             `);

             const insertLineup = db.prepare(`
                               INSERT INTO lineups (user_id, round_id, round_name, player_id, is_captain, role)
                               VALUES (@user_id, @round_id, @round_name, @player_id, @is_captain, @role)
                               ON CONFLICT(user_id, round_id, player_id) DO UPDATE SET
                               is_captain=excluded.is_captain,
                               role=excluded.role
                             `);

             db.transaction(() => {
                for (const user of standings) {
                    // Insert user info
                    insertUser.run({
                        id: user.id.toString(),
                        name: user.name
                    });

                    // Insert User Round Score (ALWAYS update/insert since we cleared table)
                    if (user.lineup) {
                        try {
                            const participated = user.lineup.count ? 1 : 0;
                            const alineacion = user.lineup.type || null;
                            db.prepare(`
                                INSERT INTO user_rounds (user_id, round_id, round_name, points, participated, alineacion)
                                VALUES (?, ?, ?, ?, ?, ?)
                                ON CONFLICT(user_id, round_id) DO UPDATE SET
                                points=excluded.points,
                                participated=excluded.participated,
                                round_name=excluded.round_name,
                                alineacion=excluded.alineacion
                            `).run(
                                user.id.toString(),
                                roundId,
                                roundName,
                                user.lineup.points || 0,
                                participated,
                                alineacion
                            );
                        } catch (e) {
                            console.error(`Error inserting user_round for ${user.name}: ${e.message}`);
                        }
                    }

                    // Insert Lineup (ONLY if not exists or is last round)
                    // We check existingLineupRounds
                    if (!existingLineupRounds.has(roundId) || roundId >= lastLineupRoundId) {
                        if (user.lineup && user.lineup.players) {
                            const captainId = user.lineup.captain ? user.lineup.captain.id : null;
                            
                            user.lineup.players.forEach((playerId, index) => {
                                try {
                                    let role = 'suplente';
                                    if (index < 5) role = 'titular';
                                    else if (index === 5) role = '6th_man';
                                    // Check if player exists in our list
                                    if (!playersList[playerId]) {
                                        // console.warn(`   Skipping lineup for unknown player ${playerId}`);
                                        return; // Use return for forEach to skip current iteration
                                    }



                                    insertLineup.run({
                                        user_id: user.id.toString(),
                                        round_id: roundId,
                                        round_name: roundName,
                                        player_id: playerId,
                                        is_captain: playerId === captainId ? 1 : 0,
                                        role: role
                                    });
                                    insertedCount++;
                                } catch (e) {
                                    // Ignore duplicates
                                }
                            });
                        }
                    }
                }
             })();
             console.log(`   -> Synced standings/lineups for ${standings.length} users.`);
         }
    } else {
        console.log('Skipping lineups (round not finished/active).');
    }
    
    return insertedCount;
}
