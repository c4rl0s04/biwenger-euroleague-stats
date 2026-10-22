import { replaceLineupSnapshot } from '../../repositories/lineup-snapshot';
import {
  fetchPlayerDetails as defaultFetchPlayerDetails,
  fetchRoundsLeague as defaultFetchRoundsLeague,
} from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { preparePlayerMutations, type PlayerMutations } from '../../../db/mutations/players';
import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface LineupsDependencies {
  replaceSnapshot?: typeof replaceLineupSnapshot;
  fetchRoundsLeague?: (roundId: number) => Promise<any>;
  fetchPlayerDetails?: (playerId: number) => Promise<any>;
  prepareUserMutations?: (db: unknown, options: { seasonId?: string }) => UserMutations;
  preparePlayerMutations?: (db: unknown, options: { seasonId?: string }) => PlayerMutations;
}

/**
 * Syncs validated round-specific snapshots for live or finished rounds.
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

    if (!Array.isArray(standings))
      throw new Error(
        `Round ${roundId} returned no usable standings; existing snapshots retained.`
      );
    if (standings) {
      const mutations = userMutationsFactory(db as any, { seasonId: manager.context.seasonId });
      const playerMutations = playerMutationsFactory(db as any, {
        seasonId: manager.context.seasonId,
      });
      const positions: any = CONFIG.POSITIONS;

      for (const user of standings) {
        if (!user || !/^[1-9]\d*$/.test(String(user.id)) || typeof user.name !== 'string')
          throw new Error('Invalid manager in round snapshot.');
        const snapshot = user.lineup?.players;
        // Missing snapshots are unavailable, not an instruction to erase the saved squad.
        if (!Array.isArray(snapshot)) {
          manager.log(`Lineup round ${dbRoundId}: manager ${user.id} unavailable; retained.`);
          continue;
        }
        const present = snapshot.filter((id: unknown) => id !== null && id !== 0);
        if (
          snapshot.length > 10 ||
          present.some((id: unknown) => !/^[1-9]\d*$/.test(String(id))) ||
          new Set(present.map(String)).size !== present.length
        )
          throw new Error(`Invalid lineup snapshot for manager ${user.id}; retained.`);
        const rawCaptain = user.lineup.captain;
        const captain = rawCaptain && typeof rawCaptain === 'object' ? rawCaptain.id : rawCaptain;
        if (
          captain != null &&
          !snapshot.slice(0, 5).some((id: unknown) => id != null && String(id) === String(captain))
        )
          throw new Error(`Invalid captain in round snapshot for manager ${user.id}.`);
        const rows = [];

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
          const captainId = captain == null ? null : String(captain);

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

              rows.push({
                user_id: user.id.toString(),
                round_id: dbRoundId,
                round_name: roundName,
                player_id: playerId,
                is_captain: String(playerId) === captainId,
                role: role,
              });
            } catch (e) {
              throw new Error(`Failed to store lineup player ${playerId}.`, { cause: e });
            }
          }
          await (dependencies.replaceSnapshot || replaceLineupSnapshot)(
            db as never,
            manager.context.seasonId!,
            String(user.id),
            dbRoundId,
            rows
          );
          insertedCount += rows.length;
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
