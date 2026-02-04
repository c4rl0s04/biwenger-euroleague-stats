import dotenv from 'dotenv';
import path from 'path';

// Load Environment Variables
console.log('🔧 Loading Environment...');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Dynamic import to ensure env vars are loaded first
async function run() {
  console.log('🔌 Importing API Client...');
  const { fetchAllPlayers } = await import('../src/lib/api/biwenger-client.js');

  console.log('📡 Fetching All Players from Biwenger API...');
  try {
    const response = await fetchAllPlayers();

    // Check main data structure
    const data = response.data;
    if (!data) {
      console.error('❌ No data property in response:', Object.keys(response));
      return;
    }

    // Players might be nested differently depending on API version/league type
    const playersList = data.data ? data.data.players : data.players;

    if (!playersList) {
      console.error('❌ Could not find players list. Structure:', Object.keys(data));
      return;
    }

    const playerIds = Object.keys(playersList);
    console.log(`✅ Found ${playerIds.length} players.`);

    // Inspect first 3 players
    console.log('\n🔎 Inspecting sample players for "points" fields:');
    const sampleIds = playerIds.slice(0, 3);

    for (const id of sampleIds) {
      const player = playersList[id];
      console.log(`\n--- Player: ${player.name} (${id}) ---`);

      // Log all properties that look like 'points' or 'score'
      const relevantKeys = Object.keys(player).filter(
        (k) =>
          k.toLowerCase().includes('point') ||
          k.toLowerCase().includes('score') ||
          k.toLowerCase().includes('total') ||
          k.toLowerCase().includes('stats')
      );

      if (relevantKeys.length > 0) {
        relevantKeys.forEach((k) => console.log(`   ${k}: ${player[k]}`));
      } else {
        console.log('   (No explicit "points" keys found)');
      }

      // Log raw object to be sure
      console.log('   Raw Keys:', Object.keys(player).join(', '));
    }
  } catch (error) {
    console.error('❌ Error fetching players:', error);
  } finally {
    process.exit(0);
  }
}

run();
