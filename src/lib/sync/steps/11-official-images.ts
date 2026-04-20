import { CONFIG } from '../../config';
import { prepareEuroleagueMutations } from '../../db/mutations/euroleague';
import { SyncManager } from '../manager';

// Simple sleep to respect rate limits
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step 11: Sync Official Euroleague Player Images
 * Iterates players with a 'euroleague_code', fetches their profile, and updates 'img'.
 * Source: Official Euroleague website.
 *
 * @param manager
 */
export async function run(manager: SyncManager) {
  manager.log('\n🖼️  Step 11: Syncing Official Euroleague Player Images...');
  const db = manager.context.db;
  const mutations = prepareEuroleagueMutations(db as any);

  // Get players with Euroleague Code
  const allPlayers = await mutations.getAllPlayers();
  const players = allPlayers.filter((p: any) => p.euroleague_code);

  manager.log(`   Found ${players.length} players with Euroleague codes.`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const player of players) {
    try {
      // Pad ID to 6 digits (strip 'P' prefix if present)
      const cleanCode = player.euroleague_code.toString().replace(/\D/g, '');
      const paddedId = cleanCode.padStart(6, '0');

      // The deterministic CDN pattern used by Euroleague
      const imageUrl = `https://media-cdn.euroleague.net/p/${paddedId}/profile.png`;

      await mutations.updatePlayerImage(imageUrl, player.id);
      updatedCount++;

      // Show progress every 50 players
      if (updatedCount > 0 && updatedCount % 50 === 0) {
        manager.log(`      Synced ${updatedCount} images...`);
      }
    } catch (e) {
      manager.error(`   ❌ Error syncing ${player.name}:`, e);
      errorCount++;
    }
  }

  return {
    success: true,
    message: `Finished image sync. Updated: ${updatedCount}, Errors/Missing: ${errorCount}`,
  };
}
