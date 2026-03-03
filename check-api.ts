import { fetchMarketListings } from './src/api/biwenger-client';
import { db } from './src/lib/db/client';

async function check() {
  try {
    const res = await fetchMarketListings();
    const items = res?.data?.sales || [];
    console.log(`API returned ${items.length} sales.`);
    
    let sysSellers = 0;
    let userSellers = 0;
    
    for (const item of items) {
      if (!item.user || !item.user.id) {
        sysSellers++;
      } else {
        userSellers++;
      }
    }
    console.log(`System sellers: ${sysSellers}, User sellers: ${userSellers}`);
    
    // DB check
    const dbRes = await (db as any).query(`
      SELECT seller_id, COUNT(*) 
      FROM market_listings 
      WHERE listed_at = (SELECT MAX(listed_at) FROM market_listings)
      GROUP BY seller_id
    `);
    
    console.log("DB Grouped by seller_id:");
    console.log(dbRes.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
