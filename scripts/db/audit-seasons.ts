import * as dotenv from 'dotenv';
import { createCliPool, isLocalDatabaseTarget } from '../../src/lib/db/cli';

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

async function main() {
  const allowRemote =
    process.argv.includes('--allow-remote') || process.env.ALLOW_REMOTE_SEASON_AUDIT === 'true';

  if (!allowRemote && !isLocalDatabaseTarget()) {
    console.error('Refusing to audit a remote-looking database target without explicit approval.');
    console.error(
      'Take backups first, then rerun with ALLOW_REMOTE_SEASON_AUDIT=true or --allow-remote.'
    );
    process.exit(2);
  }

  const pool = createCliPool();

  try {
    const seasonsRes = await pool.query('SELECT * FROM seasons ORDER BY created_at ASC');
    console.log(`\nFound ${seasonsRes.rowCount} seasons:`);
    for (const s of seasonsRes.rows) {
      console.log(
        `  - ${s.id} (${s.name}): status=${s.status}, sync=${s.is_sync_enabled}, starts=${s.starts_at}, ends=${s.ends_at}`
      );
    }

    console.log('\nChecking for NULL season_id records across tables:');
    let hasNulls = false;
    for (const table of SEASON_TABLES) {
      try {
        const res = await pool.query(
          `SELECT COUNT(*) as count FROM ${table} WHERE season_id IS NULL`
        );
        const count = parseInt(res.rows[0].count, 10);
        if (count > 0) {
          console.log(`  ❌ ${table}: ${count} rows with NULL season_id!`);
          hasNulls = true;
        } else {
          console.log(`  ✅ ${table}: 0 NULLs`);
        }
      } catch (err: any) {
        console.log(`  ⚠️  ${table}: failed to query (${err.message})`);
      }
    }

    console.log('\nChecking for un-migrated price cache drift in player_seasons:');
    try {
      const driftRes = await pool.query(`
        SELECT COUNT(*) as count
        FROM player_seasons ps
        LEFT JOIN (
          SELECT DISTINCT ON (season_id, player_id) season_id, player_id, price
          FROM market_values
          ORDER BY season_id, player_id, date DESC
        ) mv ON ps.season_id = mv.season_id AND ps.player_id = mv.player_id
        WHERE ps.price IS NOT NULL AND mv.price IS NOT NULL AND ps.price != mv.price
      `);
      const driftCount = parseInt(driftRes.rows[0].count, 10);
      if (driftCount > 0) {
        console.log(
          `  ⚠️  Found ${driftCount} player_seasons rows where price does not match latest market_values.`
        );
        console.log('      Run `npm run db:repair:player-prices` to reconcile.');
      } else {
        console.log('  ✅ All player_seasons prices match latest market_values.');
      }
    } catch (err: any) {
      console.log(`  ⚠️  Could not verify price drift: ${err.message}`);
    }

    console.log('\nChecking date boundaries vs season assignments:');
    for (const { table, column } of DATE_TABLES) {
      if (!column) continue;
      try {
        const query = `
          SELECT t.season_id, s.starts_at, s.ends_at, MIN(t.${column}) as min_date, MAX(t.${column}) as max_date, COUNT(*) as count
          FROM ${table} t
          JOIN seasons s ON t.season_id = s.id
          WHERE t.${column} IS NOT NULL
          GROUP BY t.season_id, s.starts_at, s.ends_at
        `;
        const res = await pool.query(query);
        console.log(`  Table ${table}.${column}:`);
        for (const row of res.rows) {
          const minD = new Date(row.min_date).toISOString().split('T')[0];
          const maxD = new Date(row.max_date).toISOString().split('T')[0];
          const starts = row.starts_at
            ? new Date(row.starts_at).toISOString().split('T')[0]
            : 'unbounded';
          const ends = row.ends_at
            ? new Date(row.ends_at).toISOString().split('T')[0]
            : 'unbounded';
          console.log(
            `    Season ${row.season_id}: ${row.count} rows. Date range: [${minD} to ${maxD}] (Season window: [${starts} to ${ends}])`
          );
        }
      } catch (err: any) {
        console.log(`  ⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\nAudit complete.');
    process.exit(hasNulls ? 1 : 0);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
