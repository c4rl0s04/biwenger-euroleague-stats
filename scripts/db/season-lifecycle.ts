import * as dotenv from 'dotenv';
import pg from 'pg';
import { getSeasonConfig, validateSeasonConfig } from '../../src/lib/config';
import { createCliPool } from '../../src/lib/db/cli';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SYNC_LOCK_KEYS = [823744, 823745];

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
  const seasonId =
    process.env.NEXT_SEASON_ID?.trim() || process.env.SEASON_ID?.trim() || configuredSeason.ID;
  const seasonName =
    process.env.NEXT_SEASON_NAME?.trim() ||
    process.env.SEASON_NAME?.trim() ||
    configuredSeason.NAME;
  const euroleagueCode =
    process.env.EUROLEAGUE_SEASON_CODE?.trim() || configuredSeason.EUROLEAGUE_CODE;
  const startDate = process.env.LEAGUE_START_DATE?.trim() || configuredSeason.START_DATE;
  const endDate = process.env.SEASON_END_DATE?.trim() || null;
  const sourceLeagueId =
    process.env.BIWENGER_LEAGUE_ID?.trim() || configuredSeason.BIWENGER_LEAGUE_ID;

  requireBackupConfirmation();
  await assertNoSyncRunning(pool);

  await pool.query('BEGIN');
  try {
    const active = await pool.query<{ id: string }>(
      "SELECT id FROM seasons WHERE status = 'active'"
    );
    if (active.rowCount && active.rows.some((row) => row.id !== seasonId)) {
      throw new Error(
        `Another season is already active: ${active.rows.map((row) => row.id).join(', ')}. Freeze it before creating a new active season.`
      );
    }

    const inserted = await pool.query(
      `
      INSERT INTO seasons (
        id,
        name,
        status,
        is_sync_enabled,
        euroleague_code,
        starts_at,
        ends_at,
        source_league_id,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        'active',
        true,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          status = 'active',
          is_sync_enabled = true,
          euroleague_code = EXCLUDED.euroleague_code,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          source_league_id = EXCLUDED.source_league_id,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      RETURNING id, name, status, source_league_id
    `,
      [
        seasonId,
        seasonName,
        euroleagueCode,
        startDate,
        endDate,
        sourceLeagueId,
        'Provisioned via db:season:create-next',
      ]
    );

    await pool.query('COMMIT');
    console.log(`Season ${seasonId} ready:`, inserted.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  if (!['freeze', 'create-next'].includes(command)) {
    throw new Error('Usage: tsx scripts/db/season-lifecycle.ts <freeze|create-next>');
  }

  const pool = createCliPool();

  try {
    if (command === 'freeze') {
      await freezeSeason(pool);
      return;
    }

    if (command === 'create-next') {
      await createNextSeason(pool);
      return;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Season lifecycle command failed:', error);
  process.exit(1);
});
