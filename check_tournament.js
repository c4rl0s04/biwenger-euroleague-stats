import { biwengerFetch } from './src/lib/api/biwenger-client.js';

const args = process.argv.slice(2);
const tournamentId = args[0] || 129035; // Default to Torneo #2 if no arg provided

async function run() {
  console.log(`Fetching details for Tournament ID: ${tournamentId}...`);
  console.log('---------------------------------------------------');
  try {
    const res = await biwengerFetch(`/tournaments/${tournamentId}`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(`❌ Error fetching tournament ${tournamentId}:`, e.message);
  }
}

run();
