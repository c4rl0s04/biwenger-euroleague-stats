import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

export interface UserColorsDependencies {
  prepareMutations?: (db: unknown, options: { seasonId: string }) => UserMutations;
}

/**
 * Ensures every season user has a deterministic color_index between 0 and 12 based on alphabetical ordering.
 */
export async function syncUserColors(
  manager: SyncManager,
  dependencies: UserColorsDependencies = {}
) {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) {
    throw new Error('Canonical sync season was not resolved before user color assignment.');
  }

  manager.log('\n🎨 Syncing User Colors...');
  const mutationsFactory = dependencies.prepareMutations || prepareUserMutations;

  try {
    const mutations = mutationsFactory(db as any, { seasonId });

    // Fetch all users
    const usersRes = await mutations.getAllUsers();
    const users = Array.isArray(usersRes)
      ? usersRes
      : (usersRes as any).rows || (usersRes as any).all();

    if (!Array.isArray(users) || users.length === 0) {
      return { summary: 'No users require a color.', counts: { users: 0, updated: 0 } };
    }

    let updatedCount = 0;

    // Update colors with modulo 13 palette
    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      const newColorIdx = index % 13;

      if (user.color_index !== newColorIdx) {
        await mutations.updateUserColor(newColorIdx, user.id);
        updatedCount++;
      }
    }

    return {
      summary: 'Season-scoped user colors verified.',
      counts: { users: users.length, updated: updatedCount },
    };
  } catch (err: any) {
    throw new Error('Failed to assign season user colors.', { cause: err });
  }
}

/** Compatibility export */
export const run = syncUserColors;
