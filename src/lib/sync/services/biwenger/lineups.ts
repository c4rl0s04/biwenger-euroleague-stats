import { fetchRoundsLeague } from '../../../api/biwenger-client';
import { prepareUserMutations } from '../../../db/mutations/users';
import { SyncManager } from '../../manager';

/**
 * Syncs lineups for finished rounds.
 * @param manager
 * @param round - Round object
 * @param playersListInput - Map of player IDs to player objects
 * @returns Object with success boolean and inserted count
 */
export async function run(manager: SyncManager, round: any, playersListInput?: any) {
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
    let standings: any = null;
    try {
      const roundData = await fetchRoundsLeague(roundId);
      if (roundData.data) {
        if (roundData.data.round && roundData.data.round.standings) {
          standings = roundData.data.round.standings;
        } else if (roundData.data.league && roundData.data.league.standings) {
          standings = roundData.data.league.standings;
        }
      }
    } catch (e: any) {
      manager.error(`Error fetching round details for ${roundId}: ${e.message}`);
    }

    if (standings) {
      // Initialize Mutations
      const mutations = prepareUserMutations(db as any);

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
              participated: participated === 1,
              alineacion: alineacion,
            });
          } catch (e: any) {
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
                manager.log(
                  `      ⚠️ Player ${playerId} not in list. Skipping details fetch (User requested).`
                );
                // We do NOT fetch/insert into players table.
                // We proceed to insert the lineup row with the ID (Ghost Player).
              }

              // Proceed even if not in list (table has no FK constraint on player_id based on schema.js check)
              // But if we want names in UI, we needed the fetch above.

              await mutations.upsertLineup({
                user_id: user.id.toString(),
                round_id: dbRoundId,
                round_name: roundName,
                player_id: playerId,
                is_captain: playerId === captainId,
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
  db: any,
  round: any,
  existingLineupRounds: any,
  lastLineupRoundId: any,
  playersList: any
) => {
  const mockManager = {
    context: { db, playersList: playersList || {} },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  const res = await run(mockManager, round, playersList);
  return res.insertedCount;
};
