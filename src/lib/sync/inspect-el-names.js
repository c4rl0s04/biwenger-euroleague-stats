import { fetchTeams } from '../api/euroleague-client.js';

async function inspect() {
  try {
    const data = await fetchTeams();
    const clubs = Array.isArray(data.clubs.club) ? data.clubs.club : [data.clubs.club];

    const targets = ['Maccabi', 'Baskonia', 'Panathinaikos', 'Virtus'];

    console.log('Targeted Euroleague Club Names:');
    clubs
      .filter((c) => targets.some((t) => c.name.includes(t)))
      .forEach((c) => {
        console.log(`- Code: ${c.code}, Name: "${c.name}", TVCode: "${c.tvcode}"`);
      });
  } catch (e) {
    console.error(e);
  }
}

inspect();
