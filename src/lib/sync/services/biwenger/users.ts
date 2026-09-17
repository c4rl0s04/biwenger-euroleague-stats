import { fetchLeague } from '../../../api/biwenger-client';
import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface UsersDependencies {
  fetchLeague?: () => Promise<any>;
  prepareMutations?: (db: unknown, options: { seasonId: string }) => UserMutations;
}

/**
 * Syncs league standings (users) to the local database.
 */
export async function syncBiwengerUsers(
  manager: SyncManager,
  dependencies: UsersDependencies = {}
) {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) {
    throw new Error('Canonical sync season was not resolved before user ingestion.');
  }

  manager.log('Fetching standings');
  const getLeague = dependencies.fetchLeague || fetchLeague;
  const mutationsFactory = dependencies.prepareMutations || prepareUserMutations;

  try {
    const league = await getLeague();
    const standings = league.data.standings;

    const mutations = mutationsFactory(db as any, { seasonId });
    const activeUserIds: string[] = [];

    for (const user of standings) {
      activeUserIds.push(user.id.toString());
      await mutations.upsertUser({
        id: user.id.toString(),
        name: user.name,
        icon: user.icon ? `https://cdn.biwenger.com/${user.icon}` : null,
      });
    }
    await mutations.markSeasonUsersInactiveExcept(activeUserIds);

    return {
      summary: 'Biwenger league users synchronized.',
      counts: { users: standings.length },
    };
  } catch (err: any) {
    throw new Error('Failed to synchronize Biwenger users.', { cause: err });
  }
}

/** Compatibility export */
export const run = syncBiwengerUsers;
