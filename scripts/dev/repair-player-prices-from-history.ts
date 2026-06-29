import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { db } from '../../src/lib/db/client';

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

function isRemoteDatabaseTarget(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const host = process.env.POSTGRES_HOST;

  if (url) {
    return !url.includes('localhost') && !url.includes('127.0.0.1');
  }

  return Boolean(host && host !== 'localhost' && host !== '127.0.0.1');
}

async function getPriceDrift(): Promise<PriceDriftRow[]> {
  const result = await (db as any).query(`
    WITH latest AS (
      SELECT DISTINCT ON (player_id)
        player_id,
        price AS latest_price,
        date AS latest_date
      FROM market_values
      WHERE price IS NOT NULL
      ORDER BY player_id, date DESC
    )
    SELECT
      p.id,
      p.name,
      p.price AS stored_price,
      latest.latest_price,
      latest.latest_date::text,
      (latest.latest_price - p.price) AS delta
    FROM players p
    JOIN latest ON latest.player_id = p.id
    WHERE p.price IS DISTINCT FROM latest.latest_price
    ORDER BY ABS(latest.latest_price - p.price) DESC NULLS LAST, p.name
  `);

  return result.rows;
}

async function applyRepair(): Promise<PriceDriftRow[]> {
  await (db as any).query('BEGIN');

  try {
    const result = await (db as any).query(`
      WITH latest AS (
        SELECT DISTINCT ON (player_id)
          player_id,
          price AS latest_price,
          date AS latest_date
        FROM market_values
        WHERE price IS NOT NULL
        ORDER BY player_id, date DESC
      ),
      drift AS (
        SELECT
          p.id,
          p.name,
          p.price AS stored_price,
          latest.latest_price,
          latest.latest_date,
          (latest.latest_price - p.price) AS delta
        FROM players p
        JOIN latest ON latest.player_id = p.id
        WHERE p.price IS DISTINCT FROM latest.latest_price
      )
      UPDATE players p
      SET price = drift.latest_price
      FROM drift
      WHERE drift.id = p.id
      RETURNING
        drift.id,
        drift.name,
        drift.stored_price,
        drift.latest_price,
        drift.latest_date::text,
        drift.delta
    `);

    await (db as any).query('COMMIT');
    return result.rows;
  } catch (error) {
    await (db as any).query('ROLLBACK');
    throw error;
  }
}

function printSummary(rows: PriceDriftRow[], mode: 'dry-run' | 'applied') {
  const totalDelta = rows.reduce((sum, row) => sum + Math.abs(Number(row.delta) || 0), 0);
  const decreasesNeeded = rows.filter((row) => Number(row.latest_price) < Number(row.stored_price));
  const increasesNeeded = rows.filter((row) => Number(row.latest_price) > Number(row.stored_price));

  console.log(`Player price repair ${mode}.`);
  console.log(`Rows needing alignment: ${rows.length}`);
  console.log(`Rows where stored price is above latest: ${decreasesNeeded.length}`);
  console.log(`Rows where stored price is below latest: ${increasesNeeded.length}`);
  console.log(`Total absolute delta: ${totalDelta}`);

  if (rows.length > 0) {
    console.table(rows.slice(0, 20));
  }
}

async function main() {
  if (apply && isRemoteDatabaseTarget() && !allowRemote) {
    console.error('Refusing to repair remote-looking database without explicit approval.');
    console.error('Create a fresh backup first, then rerun with:');
    console.error('  ALLOW_REMOTE_PRICE_REPAIR=true npm run db:repair:player-prices -- --apply');
    process.exitCode = 2;
    return;
  }

  const drift = await getPriceDrift();
  printSummary(drift, 'dry-run');

  if (!apply) {
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
    if (typeof (db as any).end === 'function') {
      await (db as any).end();
    }
  });
