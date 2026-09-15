import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { createCliPool, isLocalDatabaseTarget } from '../../src/lib/db/cli';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

interface PriceDriftRow {
  id: number;
  name: string;
  stored_price: number | null;
  latest_price: number | null;
  latest_date: string;
  delta: number | null;
}

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const allowRemote = args.has('--allow-remote') || process.env.ALLOW_REMOTE_PRICE_REPAIR === 'true';

const pool = createCliPool();

function requireSafetyConfirmations() {
  if (!allowRemote && !isLocalDatabaseTarget()) {
    throw new Error(
      'Refusing to run price repair against a remote-looking database without explicit approval.\n' +
        'Set ALLOW_REMOTE_PRICE_REPAIR=true or pass --allow-remote after backing up data.'
    );
  }
}

async function getPriceDrift(): Promise<PriceDriftRow[]> {
  const result = await pool.query(`
    WITH latest AS (
      SELECT DISTINCT ON (player_id)
        player_id,
        price,
        date
      FROM market_values
      ORDER BY player_id, date DESC
    )
    SELECT
      p.id,
      p.name,
      ps.price AS stored_price,
      latest.price AS latest_price,
      latest.date::text AS latest_date,
      (latest.price - ps.price) AS delta
    FROM player_seasons ps
    JOIN players p ON p.id = ps.player_id
    JOIN latest ON latest.player_id = ps.player_id
    WHERE ps.price IS DISTINCT FROM latest.price
    ORDER BY ABS(latest.price - ps.price) DESC, p.name ASC
  `);

  return result.rows;
}

async function applyRepair(): Promise<PriceDriftRow[]> {
  await pool.query('BEGIN');

  try {
    const result = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (player_id)
          player_id,
          price,
          date
        FROM market_values
        ORDER BY player_id, date DESC
      ),
      drift AS (
        SELECT
          p.id,
          p.name,
          ps.price AS old_price,
          latest.price AS new_price,
          latest.date::text AS latest_date,
          (latest.price - ps.price) AS delta
        FROM player_seasons ps
        JOIN players p ON p.id = ps.player_id
        JOIN latest ON latest.player_id = ps.player_id
        WHERE ps.price IS DISTINCT FROM latest.price
      )
      UPDATE player_seasons ps
      SET price = drift.new_price
      FROM drift
      WHERE ps.player_id = drift.id
      RETURNING
        drift.id,
        drift.name,
        drift.old_price AS stored_price,
        drift.new_price AS latest_price,
        drift.latest_date,
        drift.delta
    `);

    await pool.query('COMMIT');
    return result.rows;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

function printSummary(rows: PriceDriftRow[], mode: 'audit' | 'applied') {
  if (rows.length === 0) {
    console.log(
      `✅ No price drift found. All player_seasons.price match the latest market_values.`
    );
    return;
  }

  console.log(`\nFound ${rows.length} players with drifting cached prices (${mode}):\n`);
  for (const row of rows) {
    const direction = (row.delta || 0) > 0 ? '+' : '';
    console.log(
      `  - [${row.id}] ${row.name}: cached=${row.stored_price?.toLocaleString() ?? 'null'} -> latest=${row.latest_price?.toLocaleString() ?? 'null'} (delta: ${direction}${row.delta?.toLocaleString() ?? '0'}) as of ${row.latest_date}`
    );
  }
}

async function main() {
  requireSafetyConfirmations();

  console.log(`🔍 Checking for player price drift against market_values history...`);
  const drift = await getPriceDrift();

  if (!apply) {
    printSummary(drift, 'audit');
    console.log('\nAudit complete.');
    console.log('No data was changed. Pass --apply to update players.price from market_values.');
    return;
  }

  const repaired = await applyRepair();
  printSummary(repaired, 'applied');
}

main()
  .catch((error) => {
    console.error('Player price repair failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
