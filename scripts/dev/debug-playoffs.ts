import 'dotenv/config';
import { fetchCompetition, fetchRoundGames } from '../../src/lib/api/biwenger-client.js';

async function debugPlayoffs() {
  console.log('🔍 Debugging Biwenger Playoff Rounds...');

  try {
    const competition = await fetchCompetition();

    // The structure can be competition.data.rounds or competition.data.season.rounds
    const rounds =
      competition?.data?.rounds ||
      competition?.data?.season?.rounds ||
      competition?.data?.data?.season?.rounds;

    if (!rounds) {
      console.error('❌ Could not find rounds in competition data.');
      console.log('Full structure keys:', Object.keys(competition));
      if (competition.data) console.log('Data keys:', Object.keys(competition.data));
      return;
    }

    console.log(`✅ Found ${rounds.length} total rounds.`);
    console.log('Rounds list summary:');
    console.log(
      'First 5:',
      rounds.slice(0, 5).map((r: any) => `${r.id}: ${r.name}`)
    );
    console.log(
      'Last 10:',
      rounds.slice(-10).map((r: any) => `${r.id}: ${r.name}`)
    );

    const playoffRounds = rounds.filter(
      (r: any) =>
        r.name.includes('Playoff') ||
        r.name.includes('Final Four') ||
        r.name.includes('Postseason') ||
        r.name.includes('Eliminatoria')
    );

    console.log('\n📅 Inspecting last 10 rounds...');
    const last10 = rounds.slice(-10);
    for (const round of last10) {
      console.log(`\n🔹 Round: ${round.name} (ID: ${round.id})...`);
      try {
        const gamesData = await fetchRoundGames(round.id);
        const games = gamesData?.data?.games || gamesData?.games || [];
        console.log(`   - Found ${games.length} games.`);
        if (games.length > 0) {
          const game = games[0];
          console.log(
            `   - Sample Game: ${game.home.name} vs ${game.away.name} (ID: ${game.id}, Date: ${new Date(game.date * 1000).toLocaleString()})`
          );
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to fetch games for round ${round.id}: ${err.message}`);
      }
    }

    // Check if there are "extra" rounds not in the main list
    console.log('\n🔎 Checking for hidden or special rounds...');
    // Some competitions have 'groups' or 'stages'
    if (competition?.data?.stages) {
      console.log(
        'Found stages:',
        competition.data.stages.map((s: any) => s.name)
      );
    }
  } catch (error: any) {
    console.error('❌ Error during debug:', error.message);
  }
}

debugPlayoffs();
