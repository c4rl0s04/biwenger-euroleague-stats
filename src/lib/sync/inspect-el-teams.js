import { fetchTeams } from '../api/euroleague-client.js';

async function inspect() {
  console.log('Fetching raw Euroleague team data...');
  try {
    const data = await fetchTeams();
    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];

    // Log a few clubs to see all properties, especially name variations
    console.log('Sample Raw Club Data:');
    clubs.slice(0, 5).forEach((c) => console.log(JSON.stringify(c, null, 2)));
  } catch (e) {
    console.error(e);
  }
}

inspect();
