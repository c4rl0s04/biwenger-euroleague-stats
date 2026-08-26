import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const activeSeason = process.env.SEASON_ID;
const historicalSeason = process.env.HISTORICAL_SEASON_ID || '2025-26';
const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (process.env.RUN_DB_TESTS !== 'true') throw new Error('RUN_DB_TESTS=true is required.');
if (!activeSeason || activeSeason === historicalSeason) {
  throw new Error('SEASON_ID must be the new season and differ from HISTORICAL_SEASON_ID.');
}
if (!connectionString) throw new Error('TEST_DATABASE_URL or DATABASE_URL is required.');
const parsedUrl = new URL(connectionString);
const databaseName = parsedUrl.pathname.slice(1);
const isLocal = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
if (!isLocal || !/(test|disposable)/i.test(databaseName)) {
  throw new Error('Isolation verification requires a local database named test or disposable.');
}

const pool = new pg.Pool({ connectionString, ssl: false });
const sha = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(value ?? []))
    .digest('hex');

async function historicalFingerprint() {
  const scopedTables = (
    await pool.query(
      `SELECT table_name FROM information_schema.columns
       WHERE table_schema='public' AND column_name='season_id' ORDER BY table_name`
    )
  ).rows.map((row) => row.table_name as string);
  const output: Record<string, string> = {};
  for (const table of scopedTables) {
    const result = await pool.query(
      `SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) AS data
       FROM ${table} t WHERE season_id=$1`,
      [historicalSeason]
    );
    output[table] = sha(result.rows[0].data);
  }
  const identities = await pool.query(
    `SELECT
       (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY to_jsonb(p)::text),'[]'::jsonb)
        FROM players p WHERE EXISTS (
          SELECT 1 FROM player_seasons ps WHERE ps.season_id=$1 AND ps.player_id=p.id
        )) AS players,
       (SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)
        FROM teams t WHERE EXISTS (
          SELECT 1 FROM matches m WHERE m.season_id=$1 AND (m.home_id=t.id OR m.away_id=t.id)
        )) AS teams`,
    [historicalSeason]
  );
  output.globalPlayers = sha(identities.rows[0].players);
  output.globalTeams = sha(identities.rows[0].teams);
  return output;
}

async function canonicalCounts() {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM official_games WHERE season_id=$1) AS games,
       (SELECT COUNT(*)::int FROM official_player_game_stats WHERE season_id=$1) AS stats,
       (SELECT COUNT(*)::int FROM official_play_by_play WHERE season_id=$1) AS plays,
       (SELECT COUNT(*)::int FROM official_shots WHERE season_id=$1) AS shots,
       (SELECT COUNT(*)::int FROM official_team_standings WHERE season_id=$1) AS standings,
       (SELECT COUNT(*)::int FROM official_team_mappings WHERE season_id=$1) AS team_mappings,
       (SELECT COUNT(*)::int FROM official_player_mappings WHERE season_id=$1) AS player_mappings`,
    [activeSeason]
  );
  return result.rows[0];
}

function runSync() {
  const result = spawnSync('npm', ['run', 'sync'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connectionString, POSTGRES_URL: connectionString },
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`Sync exited with ${result.status}.`);
}

async function main() {
  const season = await pool.query('SELECT status FROM seasons WHERE id=$1', [historicalSeason]);
  if (season.rows[0]?.status !== 'frozen') throw new Error(`${historicalSeason} must be frozen.`);
  const before = await historicalFingerprint();
  runSync();
  const firstCounts = await canonicalCounts();
  const afterFirst = await historicalFingerprint();
  runSync();
  const secondCounts = await canonicalCounts();
  const afterSecond = await historicalFingerprint();

  if (JSON.stringify(before) !== JSON.stringify(afterFirst)) {
    throw new Error(`${historicalSeason} changed during the first sync.`);
  }
  if (JSON.stringify(before) !== JSON.stringify(afterSecond)) {
    throw new Error(`${historicalSeason} changed during the second sync.`);
  }
  if (JSON.stringify(firstCounts) !== JSON.stringify(secondCounts)) {
    throw new Error('Canonical official row counts are not idempotent.');
  }
  const foreignRows = await pool.query(
    `SELECT table_name,count FROM (
       SELECT 'official_games' AS table_name,COUNT(*)::int AS count FROM official_games WHERE season_id<>$1
       UNION ALL SELECT 'official_player_game_stats',COUNT(*)::int FROM official_player_game_stats WHERE season_id<>$1
       UNION ALL SELECT 'official_play_by_play',COUNT(*)::int FROM official_play_by_play WHERE season_id<>$1
       UNION ALL SELECT 'official_shots',COUNT(*)::int FROM official_shots WHERE season_id<>$1
     ) x WHERE count>0`,
    [activeSeason]
  );
  if (foreignRows.rows.length)
    throw new Error('Official rows were written outside the active season.');
  console.log(JSON.stringify({ activeSeason, historicalSeason, counts: secondCounts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
