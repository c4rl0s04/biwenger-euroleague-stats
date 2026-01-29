import { biwengerFetch } from '../../api/biwenger-client.js';
import { CONFIG } from '../../config.js';
import { prepareMarketMutations } from '../../db/mutations/market.js';

export async function run(manager) {
  manager.log('\n🎱 Syncing Porras History (from Board)...');

  const db = manager.context.db;
  const mutations = prepareMarketMutations(db);
  const leagueId = CONFIG.API.LEAGUE_ID;

  let offset = 0;
  const limit = 50;
  let moreItems = true;
  let totalPorras = 0;

  // We'll verify if adding &type=bettingPool works.
  // Biwenger generally supports filtering board by type.

  while (moreItems) {
    manager.log(`   > Fetching board history (Offset: ${offset})...`);

    // Construct URL manually to add type filter if not in config helper
    const url = `${CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, offset, limit)}`;

    try {
      const response = await biwengerFetch(url, { skipVersionCheck: true });
      const items = response.data;

      if (!items || items.length === 0) {
        moreItems = false;
        break;
      }

      for (const t of items) {
        // Redundant check if API filter works, but safe
        if (t.type !== 'bettingPool') continue;

        const pool = t.content.pool;
        if (!pool || !pool.responses) continue;

        const roundId = pool.round ? pool.round.id : null;
        const roundName = pool.round ? pool.round.name : 'Unknown Round';

        manager.log(
          `     found porra for ${roundName} (${roundId}) - ${pool.responses.length} entries`
        );

        for (const response of pool.responses) {
          try {
            const userId = response.id;
            let prediction = response.response || response.result;
            if (Array.isArray(prediction)) {
              prediction = prediction.join('-');
            }

            // Fallback logic for hits
            let hits = response.hits;
            if (hits === undefined) hits = response.points;
            hits = hits !== undefined ? hits : null;

            if (userId && roundId) {
              await mutations.insertPorra({
                user_id: userId.toString(),
                round_id: roundId,
                round_name: roundName,
                result: prediction || '',
                aciertos: hits,
              });
              totalPorras++;
            }
          } catch (e) {
            // Ignore individual errors
          }
        }
      }

      // Pagination logic
      if (items.length < limit) {
        moreItems = false;
      } else {
        offset += limit;
      }

      // Safety break for testing - remove later if confident
      if (offset > 2000) {
        // Should cover a whole season easily
        manager.log('   Reached safety limit of 2000 items.');
        moreItems = false;
      }
    } catch (err) {
      manager.log(`   ❌ Error fetching board: ${err.message}`);
      moreItems = false;
    }
  }

  return {
    success: true,
    message: `Porras history synced. Total entries: ${totalPorras}`,
  };
}
