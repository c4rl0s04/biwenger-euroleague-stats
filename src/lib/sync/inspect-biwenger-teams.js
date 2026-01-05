import { fetchAllPlayers } from '../api/biwenger-client.js';

async function inspect() {
  console.log('Fetching Biwenger competition data...');
  try {
    const competition = await fetchAllPlayers();
    const teams = competition.data.data ? competition.data.data.teams : competition.data.teams;

    console.log('Biwenger Teams:');
    Object.values(teams).forEach((t) => {
      console.log(`- "${t.name}" (ID: ${t.id})`);
    });
  } catch (e) {
    console.error(e);
  }
}

inspect();
