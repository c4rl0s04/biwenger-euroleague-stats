import Database from 'better-sqlite3';
import path from 'path';
import { CONFIG } from '../config.js';

// Simple sleep to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const dbPath = process.env.DB_PATH || CONFIG.DB.PATH;
  const db = new Database(dbPath);

  console.log('🖼️  Syncing Official Euroleague Images...');

  // Get players with Euroleague Code
  // We need name to construct slug
  const players = db
    .prepare('SELECT id, name, euroleague_code FROM players WHERE euroleague_code IS NOT NULL')
    .all();

  console.log(`Found ${players.length} players with Euroleague codes.`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const player of players) {
    // Construct URL
    // Slug: "FIRSTNAME LASTNAME" -> "firstname-lastname"
    // But database name might be "Spagnolo, Matteo" or "Matteo Spagnolo".
    // Biwenger names are usually "Matteo Spagnolo".
    // Euroleague URL uses "firstname-lastname" (lowercase).

    const slug = player.name
      .toLowerCase()
      .replace(/,/g, '') // Remove commas if any
      .replace(/\./g, '') // Remove dots
      .replace(/\s+/g, '-') // Spaces to dashes
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Pad ID to 6 digits (strip 'P' prefix first)
    const cleanCode = player.euroleague_code.toString().replace(/\D/g, '');
    const paddedId = cleanCode.padStart(6, '0');

    const url = `https://www.euroleaguebasketball.net/euroleague/players/${slug}/${paddedId}/`;
    // console.log(`   Fetching ${player.name} (${paddedId})...`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          // Try flipping name? "lastname-firstname"?
          // Usually Biwenger has "Name Surname".
        }
        // console.warn(`   ⚠️ HTTP ${res.status} for ${url}`);
        errorCount++;
        continue;
      }

      const html = await res.text();
      const regex = /"photo":"(https:\/\/media-cdn\.cortextech\.io\/[^"]+)"/;
      const match = html.match(regex);

      if (match && match[1]) {
        const imgUrl = match[1];
        // console.log(`   ✅ Found: ${imgUrl}`);

        db.prepare('UPDATE players SET img = ? WHERE id = ?').run(imgUrl, player.id);
        updatedCount++;
      } else {
        // console.warn(`   ⚠️ No image found in JSON for ${player.name}`);
        errorCount++;
      }

      // Respect rate limit
      await sleep(200);
    } catch (e) {
      console.error(`   ❌ Error fetching ${player.name}:`, e.message);
      errorCount++;
    }

    if (updatedCount % 10 === 0 && updatedCount > 0) {
      process.stdout.write(`\r   Synced ${updatedCount}/${players.length} images...`);
    }
  }

  console.log(`\n✅ Finished. Updated: ${updatedCount}, Errors/Missing: ${errorCount}`);
}

run();
