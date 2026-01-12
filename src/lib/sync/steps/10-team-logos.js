import { CONFIG } from '../../config.js';
import { fetchTeams } from '../../api/euroleague-client.js';

import { prepareEuroleagueMutations } from '../../db/mutations/euroleague.js';

// Simple sleep to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step 10: Sync Official Euroleague Team Logos
 * Fetches team data from Euroleague API and updates the 'img' column in 'teams' table.
 * Source: Official Euroleague website (scrapes 'crest' from HTML/JSON).
 *
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n🛡️  Step 10: Syncing Official Euroleague Team Logos...');
  const db = manager.context.db;
  const mutations = prepareEuroleagueMutations(db);
  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;

  manager.log(`   Fetching official team list for season ${seasonCode}...`);

  try {
    const data = await fetchTeams(seasonCode);
    if (!data || !data.clubs || !data.clubs.club) {
      throw new Error('No clubs found in Euroleague response');
    }

    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
    manager.log(`   Found ${clubs.length} official Euroleague clubs.`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const club of clubs) {
      // 1. Prepare Codes
      const officialName = club.name;
      const urlCode = club.code.toLowerCase();
      const dbCode = club.code.toUpperCase();

      const slug = officialName
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/\./g, '')
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const url = CONFIG.ENDPOINTS.EUROLEAGUE_WEBSITE.OFFICIAL_TEAM_PROFILE(slug, urlCode);

      // 2. Fetch Logo
      let imgUrl = null;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          errorCount++;
          continue;
        }

        const html = await res.text();

        // STRATEGY A: Parse Next.js Data (Most Accurate)
        try {
          const nextDataRegex =
            /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/;
          const nextMatch = html.match(nextDataRegex);

          if (nextMatch && nextMatch[1]) {
            const jsonData = JSON.parse(nextMatch[1]);
            const pageProps = jsonData.props?.pageProps || {};
            const clubData = pageProps.club || pageProps.data?.club;

            if (clubData && clubData.crest) {
              imgUrl = clubData.crest;
            }
          }
        } catch (parseErr) {
          // Fallback
        }

        // STRATEGY B: Proximity Regex (Fallback)
        if (!imgUrl) {
          const proximityRegex = new RegExp(
            `"code":"${dbCode}".{0,300}?"crest":"(https:[^"]+)"`,
            'i'
          );
          const match = html.match(proximityRegex);
          if (match && match[1]) {
            imgUrl = match[1];
          }
        }

        // STRATEGY C: Old Regex
        if (!imgUrl) {
          const simpleRegex = /"crest":"(https:\/\/media-cdn\.cortextech\.io\/[^"]+)"/;
          const match3 = html.match(simpleRegex);
          if (match3 && match3[1]) imgUrl = match3[1];
        }
      } catch (e) {
        manager.error(`   ❌ Network error for ${officialName}:`, e);
        errorCount++;
        continue;
      }

      // 3. Update DB if image found
      if (imgUrl) {
        await mutations.updateTeamImage(imgUrl, dbCode);
        updatedCount++;
        manager.log(`      ✅ Updated [${dbCode}]: ${imgUrl}`);
      } else {
        errorCount++;
      }

      // Respect rate limit
      await sleep(200);
    }

    return {
      success: true,
      message: `Updated ${updatedCount} team logos. (Errors/Missing: ${errorCount})`,
    };
  } catch (e) {
    return { success: false, error: e };
  }
}
