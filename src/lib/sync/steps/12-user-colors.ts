import { prepareUserMutations } from '../../db/mutations/users';
import { SyncManager } from '../manager';

/**
 * Step 12: Assign User Colors
 * Ensures every user has a valid color_index between 0 and 12.
 * @param manager
 */
export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n🎨 Syncing User Colors...');

  try {
    const mutations = prepareUserMutations(db as any);

    // 2. Fetch all users
    const usersRes = await mutations.getAllUsers();
    // Sort logic is inside the query (ORDER BY name) or implied?
    // In users.js: SELECT * FROM users ORDER BY name ASC
    const users = Array.isArray(usersRes) ? usersRes : (usersRes as any).rows || (usersRes as any).all();

    if (!Array.isArray(users) || users.length === 0) {
      return { success: true, message: 'No users to colorize.' };
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
      success: true,
      message: `User colors verified. Updated ${updatedCount} users.`,
    };
  } catch (err) {
    manager.error('❌ Error syncing user colors:', err);
    return { success: false, message: 'Failed to sync user colors', error: err as any };
  }
}
