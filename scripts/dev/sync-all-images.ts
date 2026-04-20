import 'dotenv/config';

import { db } from '../../src/lib/db/client';
import { spawn } from 'child_process';
import { prepareEuroleagueMutations } from '../../src/lib/db/mutations/euroleague';

async function syncAllImages() {
  const limit = process.argv.includes('--limit')
    ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
    : undefined;
  const force = process.argv.includes('--force');
  console.log('🚀 Starting One-Time Image Sync...');
  if (force) console.log('⚠️  Force mode enabled: Syncing all players.');

  const mutations = prepareEuroleagueMutations(db as any);

  // 1. Get all players with Euroleague codes
  const players = await db.query(
    'SELECT id, name, euroleague_code, team_id, img FROM players WHERE euroleague_code IS NOT NULL'
  );
  
  const all = players.rows;
  
  // Filter for players needing sync (missing team_id OR missing official image)
  const filtered = force ? all : all.filter(p => {
    const hasOfficialImg = p.img && p.img.includes('media-cdn.incrowdsports.com');
    const hasTeam = !!p.team_id;
    return !hasOfficialImg || !hasTeam;
  });

  const playersToSync = (limit ? filtered.slice(0, limit) : filtered).map((p) => ({
    id: p.id,
    name: p.name,
    euroleague_code: p.euroleague_code,
    team_id: p.team_id,
  }));

  console.log(`📊 Total Players: ${all.length}`);
  console.log(`📊 Needing Sync: ${filtered.length}`);
  console.log(`📊 Processing: ${playersToSync.length}`);

  // 2. Fetch all teams to create a lookup map
  const teamsResult = await db.query('SELECT id, name, short_name FROM teams');
  const teamsMap = new Map<string, number>();
  teamsResult.rows.forEach(t => {
      teamsMap.set(t.name.toLowerCase(), t.id);
      if (t.short_name) teamsMap.set(t.short_name.toLowerCase(), t.id);
  });

  // 3. Spawn the Python Harvester
  const pythonProcess = spawn('python3', ['scripts/sync/bulk_harvester.py']);

  pythonProcess.stdin.write(JSON.stringify(playersToSync));
  pythonProcess.stdin.end();

  let updatedCount = 0;
  let restoredTeams = 0;

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
          // Update Image
          await mutations.updatePlayerImage(res.url, res.id);
          updatedCount++;

          // Repair Team ID if missing
          const currentPlayer = playersToSync.find(p => p.id === res.id);
          if (currentPlayer && !currentPlayer.team_id && res.team_name) {
              const matchedTeamId = teamsMap.get(res.team_name.toLowerCase());
              if (matchedTeamId) {
                  await db.query('UPDATE players SET team_id = $1 WHERE id = $2', [matchedTeamId, res.id]);
                  restoredTeams++;
              }
          }
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
    console.log(`\n🎉 Sync Complete!`);
    console.log(`   📸 Images Updated: ${updatedCount}`);
    console.log(`   🛡️  Teams Restored: ${restoredTeams}`);
    process.exit(code === 0 ? 0 : 1);
  });
}

syncAllImages();
