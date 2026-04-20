import 'dotenv/config';

import { db } from '../../src/lib/db/client';
import { spawn } from 'child_process';
import { prepareEuroleagueMutations } from '../../src/lib/db/mutations/euroleague';

async function syncAllImages() {
  const limit = process.argv.includes('--limit')
    ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
    : undefined;

  console.log('🚀 Starting One-Time Image Sync...');

  const mutations = prepareEuroleagueMutations(db as any);

  // 1. Get all players with Euroleague codes
  const players = await db.query(
    'SELECT id, name, euroleague_code FROM players WHERE euroleague_code IS NOT NULL'
  );
  const all = players.rows;
  const playersToSync = (limit ? all.slice(0, limit) : all).map((p) => ({
    id: p.id,
    name: p.name,
    euroleague_code: p.euroleague_code,
  }));

  console.log(`📊 Processing ${playersToSync.length} of ${all.length} players.`);

  // 3. Spawn the Python Harvester
  const pythonProcess = spawn('python3', ['scripts/sync/bulk_harvester.py']);

  pythonProcess.stdin.write(JSON.stringify(playersToSync));
  pythonProcess.stdin.end();

  let updatedCount = 0;

  pythonProcess.stdout.on('data', async (data) => {
    // Output might contain multiple lines if buffered
    const lines = data
      .toString()
      .split('\n')
      .filter((l: string) => l.trim() !== '');

    for (const line of lines) {
      try {
        const res = JSON.parse(line);
        if (res.success && res.url) {
          await mutations.updatePlayerImage(res.url, res.id);
          updatedCount++;
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON stdout lines
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    // Python prints progress messages to stderr
    process.stdout.write(data.toString());
  });

  pythonProcess.on('close', (code) => {
    console.log(`\n🎉 Sync Complete! Saved ${updatedCount} images to the database.`);
    process.exit(code === 0 ? 0 : 1);
  });
}

syncAllImages();
