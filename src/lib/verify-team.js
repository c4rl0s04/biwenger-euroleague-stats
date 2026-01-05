import { fetchTeamProfile } from './services/index.js';

async function verify() {
  console.log('Verifying team fetch for ID 571...');
  try {
    const team = await fetchTeamProfile(571);
    console.log('Result:', team);
  } catch (error) {
    console.error('Error:', error);
  }
}

verify();
