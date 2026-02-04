import dotenv from 'dotenv';
import path from 'path';

// Load Env BEFORE importing DB
console.log('🔧 Loading Environment...');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env

async function run() {
  console.log('🔌 Connecting to DB...');
  const { db } = await import('../src/lib/db/client.js');

  console.log('🔧 Patching Player Points...');

  try {
    const res = await db.query(`
      UPDATE players p
      SET puntos = (
        SELECT COALESCE(SUM(fantasy_points), 0)
        FROM player_round_stats
        WHERE player_id = p.id
      )
      RETURNING id
    `);
    console.log(`✅ Updated ${res.rowCount} players.`);
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    process.exit(0);
  }
}

run();
