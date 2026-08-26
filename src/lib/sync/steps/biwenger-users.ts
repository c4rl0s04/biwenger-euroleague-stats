import { fetchLeague } from '../../api/biwenger-client';
import { prepareUserMutations } from '../../db/mutations/users';
import { SyncManager } from '../manager';

/**
 * Syncs league standings (users) to the local database.
 * @param manager
 */
export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n📥 Fetching Standings...');

  try {
    const league = await fetchLeague();
    const standings = league.data.standings;

    // Initialize Mutations
    const mutations = prepareUserMutations(db as any, { seasonId: manager.context.seasonId });
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
