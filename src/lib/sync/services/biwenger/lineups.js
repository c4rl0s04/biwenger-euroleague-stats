import { fetchRoundsLeague } from '../../../api/biwenger-client.js';
import { prepareUserMutations } from '../../../db/mutations/users.js';

/**
 * Syncs lineups for finished rounds.
 * @param {import('./manager').SyncManager} manager
 * @param {Object} round - Round object
 * @param {Set<number>} existingLineupRounds - Set of round IDs already synced
 * @param {number} lastLineupRoundId - ID of the last synced round
 * @param {Object} playersListInput - Map of player IDs to player objects
 * @returns {Promise<{success: boolean, insertedCount: number, message: string}>}
 */
export async function run(manager, round, playersListInput) {
  const db = manager.context.db;
  const playersList = playersListInput || manager.context.playersList || {};

  const roundId = round.id;
  const dbRoundId = manager.resolveRoundId ? manager.resolveRoundId(round) : round.dbId || round.id; // Use mapped ID for DB if present
  const roundName = round.name;
  const status = round.status;
  let insertedCount = 0;

  if (status === 'finished' || status === 'active') {
    manager.log('Fetching lineups/standings...');

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
      manager.error(`Error fetching round details for ${roundId}: ${e.message}`);
    }

    if (standings) {
      // Initialize Mutations
      const mutations = prepareUserMutations(db);

      for (const user of standings) {
        // Insert user info
        await mutations.upsertUser({
          id: user.id.toString(),
          name: user.name,
          icon: null, // We don't have icon here usually
        });

        // Insert User Round Score (only for FINISHED rounds to avoid 0-point entries)
        if (user.lineup && status === 'finished') {
          try {
            const participated = user.lineup.count ? 1 : 0;
            const alineacion = user.lineup.type || null;
            await mutations.upsertUserRound({
              user_id: user.id.toString(),
              round_id: dbRoundId,
              round_name: roundName,
              points: user.lineup.points || 0,
              participated: participated,
              alineacion: alineacion,
            });
          } catch (e) {
            manager.error(`Error inserting user_round for ${user.name}: ${e.message}`);
          }
        }

        // Insert Lineup (ALWAYS)
        if (user.lineup && user.lineup.players) {
          // Clear previous lineup to avoid duplicates/ghosts on re-sync
          if (mutations.deleteUserLineup) {
            await mutations.deleteUserLineup({
              user_id: user.id.toString(),
              round_id: dbRoundId,
            });
          }

          const captainId = user.lineup.captain ? user.lineup.captain.id : null;

          // Sequential loop for async
          for (let index = 0; index < user.lineup.players.length; index++) {
            const playerId = user.lineup.players[index];
            try {
              let role = 'suplente';
              if (index < 5) role = 'titular';
              else if (index === 5) role = '6th_man';

              // Handle missing players (e.g. left the league)
              if (!playersList[playerId]) {
                try {
                  manager.log(`      ⚠️ Player ${playerId} not in list. Fetching details...`);
                  // Dynamic import to avoid circular dependency
                  const { fetchPlayerDetails } = await import('../../../api/biwenger-client.js');
                  const pData = await fetchPlayerDetails(playerId);

                  if (pData && pData.data) {
                    // FALLBACK: If API doesn't return ID/Name (inactive player), construct it manually
                    const player = pData.data.id ? pData.data : {
                        ...pData.data,
                        id: playerId,
                        name: pData.data.name || `Unknown Player ${playerId}`, 
                        position: pData.data.position || 5, // Default to 5 (Entrenador/Unknown) or mapped value
                        price: pData.data.price || 0,
                        img: pData.data.img || null
                    };

                    // Insert into DB as "inactive" or minimal record
                    await mutations.updatePlayerOwner({
                      // Using existing mutation or raw query
                      owner_id: null,
                      player_id: playerId,
                    });

                    // Actually we need a proper upsert for player.
                    // Since we don't have a generic upsertPlayer in `users.js` mutations (it's in `01-players` step logic),
                    // we might just insert a placeholder or do a quick raw insert if detailed mutation is unavailable.
                    // Checking schema: id, name, position, price, etc.

                    await db.query(
                      `
                     INSERT INTO players (id, name, position, img, price, status)
                     VALUES ($1, $2, $3, $4, $5, 'active')
                     ON CONFLICT(id) DO NOTHING
                   `,
                      [player.id, player.name, player.position, player.img, player.price]
                    );

                    // Add to local list so we don't fetch again
                    playersList[playerId] = player;
                  }
                } catch (err) {
                  manager.error(
                    `      ❌ Could not fetch/insert missing player ${playerId}: ${err.message}`
                  );
                  // If we can't find them, we can't insert stats/lineup properly usually, or we insert with nulls.
                  // For now, if we can't fetch, we might still want to insert the lineup entry if the DB allows it (no FK).
                }
              }

              // Proceed even if not in list (table has no FK constraint on player_id based on schema.js check)
              // But if we want names in UI, we needed the fetch above.

              await mutations.upsertLineup({
                user_id: user.id.toString(),
                round_id: dbRoundId,
                round_name: roundName,
                player_id: playerId,
                is_captain: playerId === captainId ? 1 : 0,
                role: role,
              });
              insertedCount++;
            } catch (e) {
              // Ignore duplicates
            }
          }
        }
      }
      manager.log(`   -> Synced standings/lineups for ${standings.length} users.`);
    }
  } else {
    manager.log('Skipping lineups (round not finished/active).');
  }

  return { success: true, insertedCount, message: `Synced ${insertedCount} lineup entries.` };
}

// Legacy export
export const syncLineups = async (
  db,
  round,
  existingLineupRounds,
  lastLineupRoundId,
  playersList
) => {
  const mockManager = {
    context: { db, playersList: playersList || {} },
    log: console.log,
    error: console.error,
  };
  const res = await run(mockManager, round, existingLineupRounds, lastLineupRoundId, playersList);
  return res.insertedCount;
};
