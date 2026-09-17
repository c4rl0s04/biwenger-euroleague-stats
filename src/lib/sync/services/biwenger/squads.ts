import { biwengerFetch } from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { prepareUserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface BiwengerSquadsDependencies {
  fetch: typeof biwengerFetch;
}

export const defaultSquadsDependencies: BiwengerSquadsDependencies = {
  fetch: biwengerFetch,
};

export interface BiwengerSquadsSyncResult {
  summary: string;
  counts: {
    users: number;
    playersOwned: number;
  };
}

export async function syncBiwengerSquads(
  manager: SyncManager,
  dependencies: BiwengerSquadsDependencies = defaultSquadsDependencies
): Promise<BiwengerSquadsSyncResult> {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  manager.log('Syncing squads and ownership');

  const mutations = prepareUserMutations(db as any, { seasonId });

  // 1. Reset ownerships for active teams only
  await mutations.resetActiveOwners();

  // 2. Get all users
  const usersRes = await mutations.getAllUsers();
  const users = usersRes.all();

  if (users.length === 0) {
    manager.log('No users found in database; skipping squad sync');
    return {
      summary: 'No users found; ownership was not changed.',
      counts: { users: 0, playersOwned: 0 },
    };
  }

  let totalPlayersOwned = 0;

  for (const user of users) {
    try {
      await mutations.resetUserSquad(user.id);

      const response = await dependencies.fetch(CONFIG.ENDPOINTS.BIWENGER.USER_PLAYERS(user.id));
      const data = response.data;

      if (data && data.players) {
        const playerIds = data.players.map((p: any) => p.id);

        for (const playerId of playerIds) {
          await mutations.updatePlayerOwner({
            owner_id: user.id,
            player_id: playerId,
          });
        }

        totalPlayersOwned += playerIds.length;
      }
    } catch (e: any) {
      throw new Error(`Failed to synchronize squad for ${user.name} (${user.id}).`, { cause: e });
    }
  }

  return {
    summary: 'Current Biwenger ownership synchronized.',
    counts: { users: users.length, playersOwned: totalPlayersOwned },
  };
}
