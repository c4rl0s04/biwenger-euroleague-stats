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
    WHERE table_schema = 'public'
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
    WHERE table_schema = 'public'
      AND column_name = 'season_id'
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
    WHERE table_schema = 'public'
      AND table_name = 'seasons'
      AND column_name = 'source_league_id'
  `
  );
  if (leagueBinding.rows.length !== 1) {
    throw new Error('Database schema is not season-ready; seasons.source_league_id is missing.');
  }

  const droppedColumns = await db.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND (
       (table_name = 'players' AND column_name = ANY($1::text[])) OR
       (table_name = 'teams' AND column_name = ANY($2::text[]))
     )`,
    [
      [
        'position',
        'puntos',
        'partidos_jugados',
        'played_home',
        'played_away',
        'points_home',
        'points_away',
        'points_last_season',
        'owner_id',
        'status',
        'price_increment',
        'price',
        'dorsal',
        'team_id',
      ],
      ['city', 'arena_name', 'latitude', 'longitude'],
    ]
  );
  if (droppedColumns.rows.length > 0) {
    const list = droppedColumns.rows.map((r: any) => `${r.table_name}.${r.column_name}`).join(', ');
    throw new Error(
      `Database schema has deprecated seasonal columns on global tables: ${list}. Apply migration 0014.`
    );
  }

  const requiredOfficialColumns = [
    { table: 'matches', column: 'official_game_code' },
    { table: 'matches', column: 'arena_code' },
    { table: 'matches', column: 'arena_name' },
    { table: 'matches', column: 'arena_capacity' },
    { table: 'player_round_stats', column: 'offensive_rebounds' },
    { table: 'player_round_stats', column: 'defensive_rebounds' },
    { table: 'player_round_stats', column: 'fouls_received' },
    { table: 'player_round_stats', column: 'blocks_against' },
    { table: 'player_round_stats', column: 'plus_minus' },
    { table: 'player_round_stats', column: 'games_started' },
    { table: 'player_round_stats', column: 'is_dnp' },
    { table: 'player_round_stats', column: 'official_game_code' },
  ];

  const officialColumns = await db.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND (
       (table_name = 'matches' AND column_name = ANY($1::text[])) OR
       (table_name = 'player_round_stats' AND column_name = ANY($2::text[]))
     )`,
    [
      ['official_game_code', 'arena_code', 'arena_name', 'arena_capacity'],
      [
        'offensive_rebounds',
        'defensive_rebounds',
        'fouls_received',
        'blocks_against',
        'plus_minus',
        'games_started',
        'is_dnp',
        'official_game_code',
      ],
    ]
  );
  const foundOfficial = new Set(
    officialColumns.rows.map((r: any) => `${r.table_name}.${r.column_name}`)
  );
  const missingOfficial = requiredOfficialColumns.filter(
    (col) => !foundOfficial.has(`${col.table}.${col.column}`)
  );

  if (missingOfficial.length > 0) {
    throw new Error(
      `Database schema is missing EuroLeague/provenance columns: ${missingOfficial.map((c) => `${c.table}.${c.column}`).join(', ')}. Apply migrations 0007, 0012, and 0015.`
    );
  }

  return { ready: true };
}
