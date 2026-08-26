import { createHash } from 'node:crypto';
import * as dotenv from 'dotenv';
import { db } from '../../src/lib/db/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

const seasonId =
  process.argv.find((value) => value.startsWith('--season='))?.split('=')[1] || '2025-26';
if (!/^\d{4}-\d{2}$/.test(seasonId)) throw new Error('--season must use YYYY-YY.');

const scopedTables = [
  'player_seasons',
  'user_seasons',
  'user_rounds',
  'fichajes',
  'lineups',
  'matches',
  'player_round_stats',
  'porras',
  'market_values',
  'transfer_bids',
  'initial_squads',
  'finances',
  'tournaments',
  'tournament_phases',
  'tournament_fixtures',
  'tournament_standings',
  'market_listings',
  'playoff_predictions',
  'playoff_results',
  'user_playoff_media',
  'official_games',
  'official_team_mappings',
  'official_player_mappings',
  'official_player_game_stats',
  'official_play_by_play',
  'official_shots',
  'official_team_standings',
];

const hash = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(value ?? []))
    .digest('hex');

async function main() {
  const output: Record<string, { rows: number; sha256: string }> = {};
  for (const table of scopedTables) {
    const exists = await db.query('SELECT to_regclass($1) AS name', [`public.${table}`]);
    if (!exists.rows[0]?.name) continue;
    const result = await db.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) AS data
       FROM ${table} t WHERE season_id=$1`,
      [seasonId]
    );
    output[table] = { rows: result.rows[0].count, sha256: hash(result.rows[0].data) };
  }

  const identities = await db.query(
    `SELECT
       (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY to_jsonb(p)::text),'[]'::jsonb)
        FROM players p WHERE EXISTS (
          SELECT 1 FROM player_seasons ps WHERE ps.season_id=$1 AND ps.player_id=p.id
        )) AS players,
       (SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)
        FROM teams t WHERE EXISTS (
          SELECT 1 FROM matches m WHERE m.season_id=$1 AND (m.home_id=t.id OR m.away_id=t.id)
        )) AS teams`,
    [seasonId]
  );
  output['historical_global_players'] = {
    rows: identities.rows[0].players.length,
    sha256: hash(identities.rows[0].players),
  };
  output['historical_global_teams'] = {
    rows: identities.rows[0].teams.length,
    sha256: hash(identities.rows[0].teams),
  };
  console.log(
    JSON.stringify({ seasonId, generatedAt: new Date().toISOString(), tables: output }, null, 2)
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (typeof db.end === 'function') await db.end();
  });
