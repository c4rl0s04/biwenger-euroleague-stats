import {
  getInitialSquadRetainedPoints,
  getBestInitialSquadPlayer,
} from './src/lib/db/queries/analytics/initial_squads';

async function test() {
  try {
    const retained = await getInitialSquadRetainedPoints();
    console.log('RETAINED RANKING:', JSON.stringify(retained, null, 2));

    const best = await getBestInitialSquadPlayer();
    console.log('BEST DRAFT PER USER:', JSON.stringify(best, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
