import { prepareUserMutations } from '../../db/mutations/users';
import { SyncManager } from '../manager';

/** Ensures every season user has a deterministic color_index between 0 and 12. */
export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n🎨 Syncing User Colors...');

  try {
    const mutations = prepareUserMutations(db as any, { seasonId: manager.context.seasonId });

    // 2. Fetch all users
    const usersRes = await mutations.getAllUsers();
    // Sort logic is inside the query (ORDER BY name) or implied?
    // In users.js: SELECT * FROM users ORDER BY name ASC
    const users = Array.isArray(usersRes)
      ? usersRes
      : (usersRes as any).rows || (usersRes as any).all();

    if (!Array.isArray(users) || users.length === 0) {
      return { summary: 'No users require a color.', counts: { users: 0, updated: 0 } };
    }

    let updatedCount = 0;

    // 3. Update colors
    // Sequential async updates
    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      const newColorIdx = index % 13; // 13 colors in palette

      // Optimization: Only update if changed
      if (user.color_index !== newColorIdx) {
        await mutations.updateUserColor(newColorIdx, user.id);
        updatedCount++;
      }
    }

    return {
      summary: 'Season-scoped user colors verified.',
      counts: { users: users.length, updated: updatedCount },
    };
  } catch (err) {
    throw new Error('Failed to assign season user colors.', { cause: err });
  }
}
