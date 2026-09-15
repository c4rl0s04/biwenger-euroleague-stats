import { Pool } from 'pg';

export type DbClient =
  | Pool
  | {
      query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
    };

const REQUIRED_GLOBAL_TABLES = ['users', 'teams', 'players', 'seasons'];

const REQUIRED_SEASON_SCOPED_TABLES = [
  'team_seasons',
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
  'official_team_mappings',
  'official_player_mappings',
  'official_play_by_play',
  'official_shots',
  'official_team_standings',
];

const REQUIRED_SEASON_TABLES = [...REQUIRED_GLOBAL_TABLES, ...REQUIRED_SEASON_SCOPED_TABLES];

export async function validateSchemaReady(db: DbClient) {
  const result = await db.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = "public"
      AND table_name = ANY($1::text[])
  `,
    [REQUIRED_SEASON_TABLES]
  );
  const existing = new Set(result.rows.map((row: any) => row.table_name));
  const missing = REQUIRED_SEASON_TABLES.filter((table) => !existing.has(table));

  if (missing.length > 0) {
    throw new Error(
      `Database schema is not ready; missing tables: ${missing.join(', ')}. Apply committed migrations before syncing.`
    );
  }

  const seasonColumns = await db.query(
    `
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = "public"
      AND column_name = "season_id"
      AND table_name = ANY($1::text[])
  `,
    [REQUIRED_SEASON_SCOPED_TABLES]
  );
  const scoped = new Set(seasonColumns.rows.map((row: any) => row.table_name));
  const missingSeasonColumns = REQUIRED_SEASON_SCOPED_TABLES.filter((table) => !scoped.has(table));
  if (missingSeasonColumns.length > 0) {
    throw new Error(
      `Database schema is not season-ready; season_id is missing from: ${missingSeasonColumns.join(', ')}.`
    );
  }

  const leagueBinding = await db.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = "public"
      AND table_name = "seasons"
      AND column_name = "source_league_id"
  `
  );
  if (leagueBinding.rows.length !== 1) {
    throw new Error('Database schema is not season-ready; seasons.source_league_id is missing.');
  }

  const officialColumns = await db.query(
    `SELECT table_name,column_name FROM information_schema.columns
     WHERE table_schema='public' AND (
       (table_name='matches' AND column_name='official_game_code') OR
       (table_name='player_round_stats' AND column_name = ANY($1::text[]))
     )`,
    [
      [
        'offensive_rebounds',
        'defensive_rebounds',
        'fouls_received',
        'blocks_against',
        'plus_minus',
        'games_started',
      ],
    ]
  );
  if (officialColumns.rows.length !== 7) {
    throw new Error(
      'Database schema is missing Euroleague Advanced API columns. Apply migrations 0007 and 0012.'
    );
  }
}

/**
 * @deprecated Schema authority belongs strictly to Drizzle migrations (`drizzle/*.sql`).
 * Sync pipeline only validates readiness via `validateSchemaReady()`.
 */
export async function ensureSchema(_db: DbClient): Promise<void> {
  // No-op: Drizzle migrations are the sole schema authority.
}
