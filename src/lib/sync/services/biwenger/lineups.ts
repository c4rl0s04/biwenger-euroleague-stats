import {
  fetchPlayerDetails as defaultFetchPlayerDetails,
  fetchRoundsLeague as defaultFetchRoundsLeague,
} from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { preparePlayerMutations, type PlayerMutations } from '../../../db/mutations/players';
import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface LineupsDependencies {
  fetchRoundsLeague?: (roundId: number) => Promise<any>;
  fetchPlayerDetails?: (playerId: number) => Promise<any>;
  prepareUserMutations?: (db: unknown, options: { seasonId?: string }) => UserMutations;
  preparePlayerMutations?: (db: unknown, options: { seasonId?: string }) => PlayerMutations;
}

/**
 * Syncs lineups for finished rounds.
 * @param manager
 * @param round - Round object
 * @param playersListInput - Map of player IDs to player objects
 * @param dependencies - Injected dependencies for isolated testing
 * @returns Object with success boolean and inserted count
 */
export async function syncBiwengerLineups(
  manager: SyncManager,
  round: any,
  playersListInput?: any,
  dependencies: LineupsDependencies = {}
) {
  const db = manager.context.db;
  const playersList = playersListInput || manager.context.biwenger?.players || {};

  const roundId = round.id;
  const dbRoundId = manager.resolveRoundId ? manager.resolveRoundId(round) : round.dbId || round.id;
  const roundName = round.name;
  const status = round.status;
  let insertedCount = 0;

  const fetchRounds = dependencies.fetchRoundsLeague || defaultFetchRoundsLeague;
  const fetchDetails = dependencies.fetchPlayerDetails || defaultFetchPlayerDetails;
  const userMutationsFactory = dependencies.prepareUserMutations || prepareUserMutations;
  const playerMutationsFactory = dependencies.preparePlayerMutations || preparePlayerMutations;

  if (status === 'finished' || status === 'active') {
    manager.log('Fetching lineups/standings');

    let standings: any = null;
    try {
      const roundData = await fetchRounds(roundId);
      if (roundData?.data) {
        if (roundData.data.round && roundData.data.round.standings) {
          standings = roundData.data.round.standings;
        } else if (roundData.data.league && roundData.data.league.standings) {
          standings = roundData.data.league.standings;
        }
      }
    } catch (e: any) {
      throw new Error(`Failed to fetch Biwenger round ${roundId}.`, { cause: e });
    }

    if (standings) {
      const mutations = userMutationsFactory(db as any, { seasonId: manager.context.seasonId });
      const playerMutations = playerMutationsFactory(db as any, {
        seasonId: manager.context.seasonId,
      });
      const positions: any = CONFIG.POSITIONS;

      for (const user of standings) {
        await mutations.upsertUser({
          id: user.id.toString(),
          name: user.name,
          icon: null,
        });

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
            throw new Error(`Failed to store round result for ${user.name}.`, { cause: e });
          }
        }

        if (user.lineup && user.lineup.players) {
          if (mutations.deleteUserLineup) {
            await mutations.deleteUserLineup({
              user_id: user.id.toString(),
              round_id: dbRoundId,
            });
          }

          const captainId = user.lineup.captain ? user.lineup.captain.id : null;

          for (let index = 0; index < user.lineup.players.length; index++) {
            const playerId = user.lineup.players[index];
            if (!playerId) continue;

            try {
              let role = 'suplente';
              if (index < 5) role = 'titular';
              else if (index === 5) role = '6th_man';

              if (!playersList[playerId]) {
                manager.log(`Repairing missing player ${playerId}`);
                try {
                  const details = await fetchDetails(playerId);
                  if (details?.data) {
                    const d = details.data;
                    await playerMutations.upsertPlayer({
                      id: playerId,
                      name: d.name,
                      team_id: d.team?.id || 0,
                      position: positions[d.position] || 'Unknown',
                      puntos: d.points || 0,
                      partidos_jugados: 0,
                      played_home: 0,
                      played_away: 0,
                      points_home: 0,
                      points_away: 0,
                      points_last_season: 0,
                      status: 'ok',
                      price_increment: 0,
                      price: d.price || 0,
                      img: d.img || `https://cdn.biwenger.com/players/euroleague/${playerId}.png`,
                    });
                    playersList[playerId] = { id: playerId, name: d.name };
                  }
                } catch (repairError: any) {
                  throw new Error(`Failed to repair missing player ${playerId}.`, {
                    cause: repairError,
                  });
                }
              }

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
              throw new Error(`Failed to store lineup player ${playerId}.`, { cause: e });
            }
          }
        }
      }
      manager.log(`Synced standings/lineups for ${standings.length} users`);
    }
  } else {
    manager.log('Skipping lineups (round not finished/active).');
  }

  return { insertedCount };
}

/** Compatibility export */
export const run = syncBiwengerLineups;
