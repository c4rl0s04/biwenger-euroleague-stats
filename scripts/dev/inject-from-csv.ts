import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from '../../src/lib/db/client';

async function injectFromCsv() {
  const csvPath = path.resolve(process.cwd(), 'src/lib/data/players/euroleague_players.csv');
  console.log(`📂 Reading CSV from: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`📊 Found ${dataLines.length} players in CSV.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const line of dataLines) {
    // Simple CSV parsing (name, code, img, profile)
    // Note: Some names might have commas, but our CSV seems to use commas as delimiters correctly
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const [name, code, imgUrl, profileUrl] = parts;

    if (!code) {
      skippedCount++;
      continue;
    }

    try {
      // The user mentioned the DB code has a 'P' prefix
      const elCodeWithP = `P${code}`;
      const elCodeWithoutP = code;

      // DEBUG: Check if player exists first
      const checkRes = await db.query(
        'SELECT name FROM players WHERE euroleague_code = $1 OR euroleague_code = $2',
        [elCodeWithP, elCodeWithoutP]
      );

      if (checkRes.rowCount === 0) {
        skippedCount++;
        continue;
      }

      const res = await db.query(
        'UPDATE players SET img = $1, profile_url = $2 WHERE euroleague_code = $3 OR euroleague_code = $4',
        [imgUrl || null, profileUrl || null, elCodeWithP, elCodeWithoutP]
      );

      if (res.rowCount > 0) {
        updatedCount++;
        if (updatedCount % 50 === 0) console.log(`   Processed ${updatedCount} players...`);
      } else {
        skippedCount++;
      }
    } catch (err: any) {
      console.error(`   ❌ Error updating ${name}:`, err);
      errorCount++;
    }
  }

  console.log('\n✅ Injection Complete!');
  console.log(`   📸 Players Updated: ${updatedCount}`);
  console.log(`   ⏭️  Players Skipped (no match): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  process.exit(0);
}

injectFromCsv();
