import dotenv from 'dotenv';
import pg from 'pg';
import { getCorrectedMatchDate, formatMatchTime } from './src/lib/utils/date.js';

dotenv.config({ path: '.env' });

const { Pool } = pg;
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function traceDateFlow() {
  try {
    console.log('--- Date Flow Debug ---');
    console.log(`Environment TZ: ${process.env.TZ || 'System Default'}`);

    // Fetch Zalgiris match specifically since we have reference data
    const query = `
      SELECT m.date, th.name as home, ta.name as away
      FROM matches m
      JOIN teams th ON m.home_id = th.id
      JOIN teams ta ON m.away_id = ta.id
      WHERE th.name ILIKE '%Zalgiris%'
      AND m.date > NOW()
      ORDER BY m.date ASC
      LIMIT 1
    `;

    const client = await pool.connect();
    const res = await client.query(query);
    client.release();

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const rawDate = row.date;

      console.log(`\n1. DATABASE (Raw Value)`);
      console.log(`Match: ${row.home} vs ${row.away}`);
      console.log(`Raw Object:`, rawDate);
      console.log(`Raw ISO:   ${rawDate.toISOString()}`); // What 'pg' driver returns
      console.log(`Local Hr:  ${rawDate.getHours()}`);
      console.log(`UTC Hr:    ${rawDate.getUTCHours()}`);

      console.log(`\n2. CORRECTION (getCorrectedMatchDate)`);
      const corrected = getCorrectedMatchDate(rawDate);
      console.log(`Corrected: ${corrected.toISOString()}`);
      console.log(`UTC Hr:    ${corrected.getUTCHours()}`);

      console.log(`\n3. DISPLAY (formatMatchTime)`);
      console.log(`Timezone:  'Europe/Madrid'`);
      const displayed = formatMatchTime(rawDate);
      console.log(`Result:    ${displayed}`);

      console.log(`\nANALYSIS:`);
      console.log(`If Result matches Real Time, logic is correct.`);
    } else {
      console.log('Match not found.');
    }

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

traceDateFlow();
