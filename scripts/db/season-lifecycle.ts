import '../dev/load-env.mjs';
import pg from 'pg';
import { parseSeasonLifecycleArgs } from './season-lifecycle-options';
import { createCliPool } from '../../src/lib/db/cli';

const SYNC_LOCK_KEYS = [823744, 823745];

function requireBackupConfirmation() {
  if (process.env.BACKUP_CONFIRMED !== 'true') {
    throw new Error('BACKUP_CONFIRMED=true is required before mutating season lifecycle state.');
  }
}

async function assertNoSyncRunning(pool: pg.PoolClient) {
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
  } catch (error) {
    for (const key of acquired) {
      await pool.query('SELECT pg_advisory_unlock($1)', [key]);
    }
    throw error;
  }
}

async function freezeSeason(pool: pg.PoolClient, seasonId: string) {
  requireBackupConfirmation();

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

async function createNextSeason(
  pool: pg.PoolClient,
  options: ReturnType<typeof parseSeasonLifecycleArgs>
) {
  const {
    season: seasonId,
    name: seasonName,
    euroleagueCode,
    startDate,
    endDate,
    league: sourceLeagueId,
  } = options;

  requireBackupConfirmation();

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
  const options = parseSeasonLifecycleArgs(process.argv.slice(2));
  const command = options.command;
  if (!['freeze', 'create-next'].includes(command)) {
    throw new Error('Usage: tsx scripts/db/season-lifecycle.ts <freeze|create-next>');
  }

  requireBackupConfirmation();
  const pool = createCliPool();
  const client = await pool.connect();

  try {
    await assertNoSyncRunning(client);
    if (command === 'freeze') {
      await freezeSeason(client, options.season);
      return;
    }

    if (command === 'create-next') {
      await createNextSeason(client, options);
      return;
    }
  } finally {
    try {
      for (const key of SYNC_LOCK_KEYS) await client.query('SELECT pg_advisory_unlock($1)', [key]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

main().catch((error) => {
  console.error('Season lifecycle command failed:', error);
  process.exit(1);
});
