import * as dotenv from 'dotenv';
import pg from 'pg';
import { getSeasonConfig, validateSeasonConfig } from '../../src/lib/config';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SYNC_LOCK_KEYS = [823744, 823745];

function connectionStringFromEnv(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function requireBackupConfirmation() {
  if (process.env.BACKUP_CONFIRMED !== 'true') {
    throw new Error('BACKUP_CONFIRMED=true is required before mutating season lifecycle state.');
  }
}

async function assertNoSyncRunning(pool: pg.Pool) {
  const acquired: number[] = [];

  try {
    for (const key of SYNC_LOCK_KEYS) {
      const result = await pool.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_lock($1) AS locked',
        [key]
      );
      if (!result.rows[0]?.locked) {
        throw new Error(`A sync appears to be running; advisory lock ${key} is unavailable.`);
      }
      acquired.push(key);
    }
  } finally {
    for (const key of acquired) {
      await pool.query('SELECT pg_advisory_unlock($1)', [key]);
    }
  }
}

async function freezeSeason(pool: pg.Pool) {
  if (!process.env.SEASON_ID?.trim()) {
    throw new Error('SEASON_ID is required when freezing a season.');
  }
  const seasonId = getSeasonConfig().ID;
  requireBackupConfirmation();
  await assertNoSyncRunning(pool);

  const result = await pool.query(
    `
    UPDATE seasons
    SET status = 'frozen',
        frozen_at = COALESCE(frozen_at, NOW()),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, status, frozen_at
  `,
    [seasonId]
  );

  if (result.rowCount !== 1) {
    throw new Error(`Season ${seasonId} was not found.`);
  }

  console.log(`Season ${seasonId} frozen at ${result.rows[0].frozen_at}.`);
}

async function createNextSeason(pool: pg.Pool) {
  const configuredSeason = validateSeasonConfig({ requireToken: false });
  const seasonId = configuredSeason.ID;
  const seasonName = configuredSeason.NAME;
  requireBackupConfirmation();
  await assertNoSyncRunning(pool);

  await pool.query('BEGIN');
  try {
    const active = await pool.query<{ id: string }>(
      "SELECT id FROM seasons WHERE status = 'active' FOR UPDATE"
    );

    if (active.rows.length > 0) {
      throw new Error(
        `Cannot create ${seasonId}; active season already exists: ${active.rows.map((r) => r.id).join(', ')}`
      );
    }

    const existing = await pool.query<{ id: string; status: string }>(
      'SELECT id, status FROM seasons WHERE id = $1 FOR UPDATE',
      [seasonId]
    );
    if (existing.rows.length > 0) {
      throw new Error(
        `Cannot create ${seasonId}; that season already exists with status ${existing.rows[0].status}. Existing seasons are never reactivated by create-next.`
      );
    }

    await pool.query(
      `
      INSERT INTO seasons (id, name, status, starts_at, ends_at, source_league_id, notes)
      VALUES ($1, $2, 'active', $3, $4, $5, $6)
    `,
      [
        seasonId,
        seasonName,
        configuredSeason.START_DATE,
        process.env.SEASON_END_DATE || null,
        configuredSeason.BIWENGER_LEAGUE_ID,
        process.env.SEASON_NOTES || null,
      ]
    );

    await pool.query('COMMIT');
    console.log(
      `Season ${seasonId} is now active for Biwenger league ${configuredSeason.BIWENGER_LEAGUE_ID}.`
    );
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  const connectionString = connectionStringFromEnv();
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
    if (command === 'freeze') {
      await freezeSeason(pool);
      return;
    }

    if (command === 'create-next') {
      await createNextSeason(pool);
      return;
    }

    throw new Error('Usage: tsx scripts/dev/season-lifecycle.ts <freeze|create-next>');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Season lifecycle command failed:', error);
  process.exit(1);
});
