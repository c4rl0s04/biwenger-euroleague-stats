import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';
import { fetchTeams } from '../api/euroleague-client.js';

// Simple sleep to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const dbPath = process.env.DB_PATH || CONFIG.DB.PATH;
  const db = new Database(dbPath);
  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;

  console.log(`🛡️  Syncing Official Euroleague Team Logos (Option B: Source First)...`);
  console.log(`   Fetching official team list for season ${seasonCode}...`);

  try {
    const data = await fetchTeams(seasonCode);
    if (!data || !data.clubs || !data.clubs.club) {
      throw new Error('No clubs found in Euroleague response');
    }

    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];
    console.log(`   Found ${clubs.length} official Euroleague clubs.`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const club of clubs) {
      // 1. Prepare Codes
      const officialName = club.name;

      // FOR URL: Needs to be lowercase (e.g. 'mad')
      const urlCode = club.code.toLowerCase();

      // FOR DB: Needs to be Uppercase (e.g. 'MAD')
      const dbCode = club.code.toUpperCase();

      const slug = officialName
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/\./g, '')
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const url = `https://www.euroleaguebasketball.net/euroleague/teams/${slug}/${urlCode}/`;

      // 2. Fetch Logo
      console.log(`   🔗 Accessing: ${url}`);
      let imgUrl = null;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`   ⚠️ HTTP ${res.status} for ${url}`);
          errorCount++;
          continue;
        }

        const html = await res.text();

        // STRATEGY A: Parse Next.js Data (Most Accurate)
        // This ignores "header" or "sidebar" logos and goes straight for the page data
        try {
          const nextDataRegex =
            /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/;
          const nextMatch = html.match(nextDataRegex);

          if (nextMatch && nextMatch[1]) {
            const jsonData = JSON.parse(nextMatch[1]);
            // Navigate to the club data. Structure usually: props.pageProps.club
            const pageProps = jsonData.props?.pageProps || {};
            const clubData = pageProps.club || pageProps.data?.club;

            if (clubData && clubData.crest) {
              imgUrl = clubData.crest;
            }
          }
        } catch (parseErr) {
          console.warn(`      ⚠️ JSON Parse failed for ${dbCode}, falling back to regex...`);
        }

        // STRATEGY B: Proximity Regex (Fallback)
        // Look for the "crest" property specifically inside a block that contains the team CODE
        // This prevents grabbing the generic League logo or the logo of an opponent in the "Next Game" widget.
        if (!imgUrl) {
          // Looks for: "code":"MAD" ... (anything) ... "crest":"URL"
          // OR "crest":"URL" ... (anything) ... "code":"MAD"
          // We prioritize the one where the code matches OUR team code.
          const proximityRegex = new RegExp(
            `"code":"${dbCode}".{0,300}?"crest":"(https:[^"]+)"`,
            'i'
          );
          const match = html.match(proximityRegex);
          if (match && match[1]) {
            imgUrl = match[1];
          }
        }

        // STRATEGY C: Old Regex (Last Resort - dangerous)
        if (!imgUrl) {
          const simpleRegex = /"crest":"(https:\/\/media-cdn\.cortextech\.io\/[^"]+)"/;
          const match3 = html.match(simpleRegex);
          if (match3 && match3[1]) imgUrl = match3[1];
        }
      } catch (e) {
        console.error(`   ❌ Network error for ${officialName}:`, e.message);
        errorCount++;
        continue;
      }

      // 3. Update DB if image found
      if (imgUrl) {
        const result = db.prepare('UPDATE teams SET img = ? WHERE code = ?').run(imgUrl, dbCode);

        if (result.changes > 0) {
          updatedCount++;
          console.log(`      ✅ Updated [${dbCode}]: ${imgUrl}`);
        } else {
          skippedCount++;
        }
      } else {
        console.warn(`   ⚠️ No logo found in HTML for ${officialName}`);
        errorCount++;
      }

      // Progress bar
      process.stdout.write(
        `\r   Synced ${updatedCount} updated, ${errorCount} errors, ${skippedCount} skipped...`
      );
      await sleep(200);
    }

    console.log(`\n✅ Finished.`);
  } catch (e) {
    console.error('Fatal Error:', e);
  }
}

run();
