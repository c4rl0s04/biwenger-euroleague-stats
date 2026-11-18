import { z } from 'zod';
import { biwengerFetch } from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { prepareUserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

const squadResponse = z.object({
  data: z.object({ players: z.array(z.object({ id: z.int32().positive() })) }),
});

export interface BiwengerSquadsDependencies {
  fetch: (endpoint: string) => Promise<unknown>;
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
  const { db, seasonId } = manager.context;
  if (!db || !seasonId) throw new Error('Squad sync requires a database and a resolved season.');
  manager.log('Syncing squads and ownership');

  const mutations = prepareUserMutations(db, { seasonId });
  const users = (await mutations.getAllUsers()).all();

  if (users.length === 0) {
    manager.log('No users found in database; skipping squad sync');
    return {
      summary: 'No users found; ownership was not changed.',
      counts: { users: 0, playersOwned: 0 },
    };
  }

  const ownership = new Map<number, string>();
  for (const user of users) {
    try {
      const response = await dependencies.fetch(CONFIG.ENDPOINTS.BIWENGER.USER_PLAYERS(user.id));
      const squad = squadResponse.safeParse(response);
      if (!squad.success) throw new Error('Biwenger returned an invalid squad.');

      for (const { id } of squad.data.data.players) {
        const owner = ownership.get(id);
        if (owner !== undefined && owner !== user.id) {
          throw new Error('Biwenger returned the same player in multiple squads.');
        }
        ownership.set(id, user.id);
      }
    } catch (error) {
      throw new Error(`Failed to synchronize squad for user ${user.id}.`, { cause: error });
    }
  }

  await mutations.replaceSeasonOwnership(
    Array.from(ownership, ([player_id, owner_id]) => ({ player_id, owner_id }))
  );

  return {
    summary: 'Current Biwenger ownership synchronized.',
    counts: { users: users.length, playersOwned: ownership.size },
  };
}
