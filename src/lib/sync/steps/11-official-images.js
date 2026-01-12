import { CONFIG } from '../../config.js';
import { prepareEuroleagueMutations } from '../../db/mutations/euroleague.js';

// Simple sleep to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step 11: Sync Official Euroleague Player Images
 * Iterates players with a 'euroleague_code', fetches their profile, and updates 'img'.
 * Source: Official Euroleague website.
 *
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n🖼️  Step 11: Syncing Official Euroleague Player Images...');
  const db = manager.context.db;
  const mutations = prepareEuroleagueMutations(db);

  // Get players with Euroleague Code
  const allPlayers = await mutations.getAllPlayers();
  const players = allPlayers.filter((p) => p.euroleague_code);

  manager.log(`   Found ${players.length} players with Euroleague codes.`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const player of players) {
    // Construct URL
    const slug = player.name
      .toLowerCase()
      .replace(/,/g, '') // Remove commas if any
      .replace(/\./g, '') // Remove dots
      .replace(/\s+/g, '-') // Spaces to dashes
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Pad ID to 6 digits (strip 'P' prefix if present)
    const cleanCode = player.euroleague_code.toString().replace(/\D/g, '');
    const paddedId = cleanCode.padStart(6, '0');

    const url = CONFIG.ENDPOINTS.EUROLEAGUE_WEBSITE.OFFICIAL_PLAYER_PROFILE(slug, paddedId);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        errorCount++;
        continue;
      }

      const html = await res.text();
      const regex = /"photo":"(https:\/\/media-cdn\.cortextech\.io\/[^"]+)"/;
      const match = html.match(regex);

      if (match && match[1]) {
        const imgUrl = match[1];
        await mutations.updatePlayerImage(imgUrl, player.id);
        updatedCount++;
      } else {
        errorCount++;
      }

      // Respect rate limit
      await sleep(200);
    } catch (e) {
      manager.error(`   ❌ Error fetching ${player.name}:`, e);
      errorCount++;
    }

    // Show progress every 20 players
    if (updatedCount > 0 && updatedCount % 20 === 0) {
      manager.log(`      Synced ${updatedCount} images...`);
    }
  }

  return {
    success: true,
    message: `Finished image sync. Updated: ${updatedCount}, Errors/Missing: ${errorCount}`,
  };
}
