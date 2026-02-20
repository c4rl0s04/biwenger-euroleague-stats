import { db } from '../src/lib/db/client.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Testing legacy DB connection...');
  try {
    // db is expected to be a Pool
    const res = await db.query('SELECT NOW() as now');
    console.log('Legacy DB Success:', res.rows[0]);
    // We must end the pool to exit script cleanly if not using process.exit
    if (db.end) await db.end();
  } catch (err) {
    console.error('Legacy DB Failed:', err);
    process.exit(1);
  }
}

main();
