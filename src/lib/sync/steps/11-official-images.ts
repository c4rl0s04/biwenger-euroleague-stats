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
    if (!player.euroleague_code) continue;

    try {
      process.stdout.write(`   Fetching image for ${player.name} (${player.euroleague_code})... `);

      // Use the Mobile App API which has no firewall
      const res = await fetch(
        `https://api-live.euroleague.net/v1/players?playerCode=${player.euroleague_code}&seasonCode=E2024`
      );

      if (!res.ok) {
        manager.error(`   ❌ API Error: ${res.status}`);
        errorCount++;
        continue;
      }

      const xml = await res.text();

      // Extract the image GUID or URL from the <imageurl> tag
      const imgMatch = xml.match(/<imageurl>(.*?)<\/imageurl>/i);
      const imgVal = imgMatch ? imgMatch[1] : null;

      if (imgVal) {
        // If it's a GUID, we construct the Cortex URL. If it's already a URL, we use it.
        const imgUrl = imgVal.startsWith('http')
          ? imgVal
          : `https://media-cdn.cortextech.io/${imgVal}.png`;

        await mutations.updatePlayerImage(imgUrl, player.id);
        updatedCount++;
        console.log('✅');
      } else {
        manager.warn(`   ⚠️ No image found in API for ${player.name}`);
        errorCount++;
      }

      // Respectful delay
      await sleep(100);
    } catch (e: any) {
      manager.error(`   ❌ Error syncing ${player.name}: ${e.message}`);
      errorCount++;
    }
  }

  return {
    success: true,
    message: `Finished image sync. Updated: ${updatedCount}, Errors/Missing: ${errorCount}`,
  };
}
