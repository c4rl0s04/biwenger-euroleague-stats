require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool
  .query(
    `
  SELECT m.id, m.round_id, m.date, m.home_score
  FROM matches m
  WHERE (m.home_id = 1 OR m.away_id = 1)
  ORDER BY m.date DESC
  LIMIT 10
`
  )
  .then((res) => {
    console.log(res.rows);
    pool.end();
  });
