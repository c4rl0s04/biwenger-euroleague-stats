import { db } from '../../src/lib/db/client';
import dotenv from 'dotenv';
import prompts from 'prompts';

dotenv.config();

/**
 * Interactive Script to manually fix missing player images
 */
async function fixMissingImages() {
  console.log('🖼️  Analyzing players without images...');

  try {
    // 1. Fetch players with missing images
    const res = await db.query(
      "SELECT id, name, team_id FROM players WHERE img IS NULL OR img = '' ORDER BY name ASC"
    );

    if (res.rows.length === 0) {
      console.log('✅ All players have an image! Nothing to fix.');
      return;
    }

    console.log(`Found ${res.rows.length} players missing images.\n`);
    console.log('--- Instructions ---');
    console.log('1. Paste the image URL and press Enter.');
    console.log('2. Press Enter without typing anything to SKIP a player.');
    console.log('3. Press Ctrl+C to exit the script at any time.\n');

    for (const player of res.rows) {
      const response = await prompts({
        type: 'text',
        name: 'url',
        message: `Image URL for ${player.name} (ID: ${player.id})?`,
        initial: '',
      });

      // Handle Ctrl+C (prompts returns undefined or empty if cancelled)
      if (response.url === undefined) {
        console.log('\n🛑 Script aborted by user.');
        break;
      }

      const newUrl = response.url.trim();

      if (newUrl) {
        try {
          await db.query('UPDATE players SET img = $1 WHERE id = $2', [newUrl, player.id]);
          console.log(`   ✅ Updated ${player.name}`);
        } catch (updateError: any) {
          console.error(`   ❌ Failed to update ${player.name}: ${updateError.message}`);
        }
      } else {
        console.log(`   ⏭️  Skipped ${player.name}`);
      }
    }

    console.log('\n✨ Manual image repair finished.');
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await (db as any).end();
    process.exit(0);
  }
}

fixMissingImages();
