/**
 * Step 12: Assign User Colors
 * Ensures every user has a valid color_index between 0 and 12.
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  const db = manager.context.db;
  manager.log('\n🎨 Syncing User Colors...');

  try {
    // 1. Ensure column exists (Just in case, though schema.js should catch this)
    try {
      const tableInfo = db.prepare('PRAGMA table_info(users)').all();
      const hasColorIndex = tableInfo.some((col) => col.name === 'color_index');
      if (!hasColorIndex) {
        manager.log('   🛠 Including color_index schema update...');
        db.prepare('ALTER TABLE users ADD COLUMN color_index INTEGER DEFAULT 0').run();
      }
    } catch (e) {
      // Ignore if table doesn't exist yet, but it should
    }

    // 2. Fetch all users
    const users = db.prepare('SELECT id, name, color_index FROM users ORDER BY name').all();

    if (users.length === 0) {
      return { success: true, message: 'No users to colorize.' };
    }

    // 3. Update colors
    // We re-run this logic every sync to ensure even new users get a color immediately.
    // It's deterministic based on alphabetical sort order for now.
    // If we wanted to keep existing colors stable even if sort changes,
    // we would check if (user.color_index > 0) continue;

    const updateColor = db.prepare('UPDATE users SET color_index = ? WHERE id = ?');

    let updatedCount = 0;

    // Approach: Re-assign all to ensure consistency with the palette order
    // Or: Only assign 0s?
    // Let's re-assign all so the "Rainbow" effect on the standings table looks consistently distributed
    // based on user names.

    db.transaction(() => {
      users.forEach((user, index) => {
        const newColorIdx = index % 13; // 13 colors in palette

        // Optimization: Only update if changed
        if (user.color_index !== newColorIdx) {
          updateColor.run(newColorIdx, user.id);
          updatedCount++;
        }
      });
    })();

    return {
      success: true,
      message: `User colors verified. Updated ${updatedCount} users.`,
    };
  } catch (err) {
    manager.error('❌ Error syncing user colors:', err);
    return { success: false, message: 'Failed to sync user colors', error: err };
  }
}
