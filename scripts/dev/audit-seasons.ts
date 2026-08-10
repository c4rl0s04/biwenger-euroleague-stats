import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SEASON_TABLES = [
  'user_rounds',
  'fichajes',
  'transfer_bids',
  'lineups',
  'matches',
  'player_round_stats',
  'porras',
  'market_values',
  'market_listings',
  'initial_squads',
  'finances',
  'tournaments',
  'tournament_phases',
  'tournament_fixtures',
  'tournament_standings',
  'playoff_predictions',
  'playoff_results',
  'user_playoff_media',
  'player_seasons',
  'user_seasons',
];

const DATE_TABLES = [
  { table: 'market_values', column: 'date' },
  { table: 'market_listings', column: 'listed_at' },
  { table: 'fichajes', column: 'fecha' },
  { table: 'lineups', column: null },
  { table: 'matches', column: 'date' },
];

function connectionStringFromEnv(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function isLocalDatabaseTarget(connectionString: string | undefined): boolean {
  if (!connectionString)
    return ['localhost', '127.0.0.1', 'postgres', undefined].includes(process.env.POSTGRES_HOST);

  try {
    const url = new URL(connectionString);
    return ['localhost', '127.0.0.1', 'postgres'].includes(url.hostname);
  } catch {
    return connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  }
}

async function main() {
  const connectionString = connectionStringFromEnv();
  const allowRemote =
    process.argv.includes('--allow-remote') || process.env.ALLOW_REMOTE_SEASON_AUDIT === 'true';

  if (!allowRemote && !isLocalDatabaseTarget(connectionString)) {
    console.error('Refusing to audit a remote-looking database target without explicit approval.');
    console.error(
      'Take backups first, then rerun with ALLOW_REMOTE_SEASON_AUDIT=true or --allow-remote.'
    );
    process.exit(2);
  }

  const pool = connectionString
    ? new pg.Pool({
        connectionString,
        ssl:
          connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
            ? false
            : { rejectUnauthorized: false },
      })
    : new pg.Pool({
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
        database: process.env.POSTGRES_DB,
      });

  try {
    const { getSeasonConfig } = await import('../../src/lib/config.js');
    const seasonId = getSeasonConfig().ID;
    console.log(`Season readiness audit for ${seasonId} (read-only).`);

    const seasons = await pool.query('SELECT id, name, status, frozen_at FROM seasons ORDER BY id');
    console.log('\nSeasons');
    for (const row of seasons.rows) {
      console.log(
        `  ${row.id}: ${row.status} ${row.frozen_at ? `(frozen_at=${row.frozen_at.toISOString?.() ?? row.frozen_at})` : ''}`
      );
    }

    console.log('\nRow counts');
    for (const table of SEASON_TABLES) {
      const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      const nulls = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM ${table}
        WHERE season_id IS NULL
      `
      );
      console.log(
        `  ${table}: ${result.rows[0].count} rows, ${nulls.rows[0].count} null season_id`
      );
    }

    console.log('\nDate ranges');
    for (const item of DATE_TABLES) {
      if (!item.column) {
        const result = await pool.query(
          'SELECT COUNT(*)::int AS count FROM lineups WHERE season_id = $1',
          [seasonId]
        );
        console.log(`  lineups: ${result.rows[0].count} rows for ${seasonId}`);
        continue;
      }

      const result = await pool.query(
        `
        SELECT MIN(${item.column}) AS min_date, MAX(${item.column}) AS max_date, COUNT(*)::int AS count
        FROM ${item.table}
        WHERE season_id = $1
      `,
        [seasonId]
      );
      const row = result.rows[0];
      console.log(
        `  ${item.table}.${item.column}: count=${row.count}, min=${row.min_date}, max=${row.max_date}`
      );
    }

    const ownership = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE owner_id IS NOT NULL)::int AS legacy_owned,
        (SELECT COUNT(*)::int FROM player_seasons WHERE season_id = $1 AND owner_id IS NOT NULL) AS season_owned
      FROM players
    `,
      [seasonId]
    );
    console.log('\nOwnership');
    console.log(`  players.owner_id owned: ${ownership.rows[0].legacy_owned}`);
    console.log(`  player_seasons owned: ${ownership.rows[0].season_owned}`);

    const priceMismatch = await pool.query(
      `
      WITH latest AS (
        SELECT DISTINCT ON (player_id) player_id, price
        FROM market_values
        WHERE season_id = $1
        ORDER BY player_id, date DESC, id DESC
      )
      SELECT COUNT(*)::int AS count
      FROM players p
      JOIN latest l ON l.player_id = p.id
      WHERE p.price IS DISTINCT FROM l.price
    `,
      [seasonId]
    );
    console.log('\nPrice cache');
    console.log(
      `  mismatches between players.price and latest market_values: ${priceMismatch.rows[0].count}`
    );

    const missingColumns = await pool.query(
      `
      SELECT table_name
      FROM unnest($1::text[]) AS expected(table_name)
      WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = expected.table_name
          AND c.column_name = 'season_id'
      )
      ORDER BY table_name
    `,
      [SEASON_TABLES]
    );
    console.log('\nSeason isolation');
    if (missingColumns.rows.length === 0) {
      console.log('  all expected season tables have season_id');
    } else {
      for (const row of missingColumns.rows) console.log(`  missing season_id: ${row.table_name}`);
    }

    process.exit(missingColumns.rows.length > 0 || priceMismatch.rows[0].count > 0 ? 1 : 0);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Season audit failed:', error);
  process.exit(1);
});
