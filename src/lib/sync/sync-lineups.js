import { fetchRoundsLeague } from '../api/biwenger-client.js';
import { prepareUserMutations } from '../db/mutations/users.js';

/**
 * Syncs lineups for finished rounds.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {Object} round - Round object
 * @param {Set<number>} existingLineupRounds - Set of round IDs already synced
 * @param {number} lastLineupRoundId - ID of the last synced round
 * @param {Object} playersList - Map of player IDs to player objects
 * @returns {Promise<number>} - Number of lineups inserted
 */
/**
 * Syncs lineups for finished rounds.
 * @param {import('./manager').SyncManager} manager
 * @param {Object} round - Round object
 * @param {Set<number>} existingLineupRounds - Set of round IDs already synced
 * @param {number} lastLineupRoundId - ID of the last synced round
 * @param {Object} playersListInput - Map of player IDs to player objects
 * @returns {Promise<{success: boolean, insertedCount: number, message: string}>}
 */
export async function run(
  manager,
  round,
  existingLineupRounds,
  lastLineupRoundId,
  playersListInput
) {
  const db = manager.context.db;
  const playersList = playersListInput || manager.context.playersList || {};

  const roundId = round.id;
  const dbRoundId = round.dbId || round.id; // Use mapped ID for DB if present
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

      db.transaction(() => {
        for (const user of standings) {
          // Insert user info
          // Used to be INSERT OR IGNORE, now UPSERT but minimal impact
          mutations.upsertUser.run({
            id: user.id.toString(),
            name: user.name,
            icon: null, // We don't have icon here usually, prevent overwriting with null if possible?
            // Wait, upsertUser uses COALESCE(excluded.icon, users.icon) so passing null is safe.
          });

          // Insert User Round Score (only for FINISHED rounds to avoid 0-point entries)
          if (user.lineup && status === 'finished') {
            try {
              const participated = user.lineup.count ? 1 : 0;
              const alineacion = user.lineup.type || null;
              mutations.upsertUserRound.run(
                user.id.toString(),
                dbRoundId,
                roundName,
                user.lineup.points || 0,
                participated,
                alineacion
              );
            } catch (e) {
              manager.error(`Error inserting user_round for ${user.name}: ${e.message}`);
            }
          }

          // Insert Lineup (ONLY if not exists or is last round)
          // We check existingLineupRounds
          if (!existingLineupRounds.has(dbRoundId) || dbRoundId >= lastLineupRoundId) {
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

                  mutations.upsertLineup.run({
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
              });
            }
          }
        }
      })();
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
