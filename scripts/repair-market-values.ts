import 'dotenv/config';
import { db } from '../src/lib/db/client.js';
import { fetchPlayerDetails } from '../src/lib/api/biwenger-client.js';

const SLEEP_MS = 600;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parsePriceDate = (dateInt: number | string): string => {
  const str = dateInt.toString();
  let year = '20' + str.substring(0, 2);
  let month = str.substring(2, 4);
  let day = str.substring(4, 6);

  if (parseInt(month) > 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  if (parseInt(month) > 12) {
    return `${year}-01-01`;
  }

  return `${year}-${month}-${day}`;
};

async function repairMarketValues() {
  console.log('🛠️  Starting Market Values Repair Script...');

  try {
    // 1. Delete all corrupted 2020 records
    console.log('🗑️  Deleting corrupted 2020 records from market_values...');
    const deleteRes = await (db as any).query(
      'DELETE FROM market_values WHERE EXTRACT(YEAR FROM date) = 2020'
    );
    console.log(`✅ Deleted ${deleteRes.rowCount} corrupted records.`);

    // 2. Fetch all players
    console.log('📥 Fetching all players from DB...');
    const playersRes = await (db as any).query('SELECT id, name FROM players');
    const players = playersRes.rows;
    console.log(`👥 Found ${players.length} players. Processing...`);

    let updatedCount = 0;

    // 3. Re-fetch full historical prices for each player and insert
    for (const player of players) {
      console.log(`⏳ Fetching details for ${player.name} (${player.id})...`);

      try {
        const details = await fetchPlayerDetails(player.id);

        if (details.data && details.data.prices && Array.isArray(details.data.prices)) {
          let insertedForPlayer = 0;

          for (const [dateInt, price] of details.data.prices) {
            const dateStr = parsePriceDate(dateInt);

            const insertSql = `
              INSERT INTO market_values (player_id, price, date)
              VALUES ($1, $2, $3)
              ON CONFLICT (player_id, date) DO NOTHING
            `;

            const res = await (db as any).query(insertSql, [player.id, price, dateStr]);
            if (res.rowCount && res.rowCount > 0) {
              insertedForPlayer++;
              updatedCount++;
            }
          }
          console.log(
            `   ✅ Restored ${insertedForPlayer} missing price points for ${player.name}`
          );
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to fetch/insert for ${player.name}: ${err.message}`);
      }

      await sleep(SLEEP_MS); // Respect API rate limits
    }

    console.log(
      `\n🎉 Repair Complete! Successfully restored ${updatedCount} total historical price points.`
    );
  } catch (err: any) {
    console.error('❌ Fatal Error:', err);
  } finally {
    // Terminate DB connection pool to allow script to exit
    if (db && typeof (db as any).end === 'function') {
      await (db as any).end();
    }
    process.exit(0);
  }
}

repairMarketValues();
