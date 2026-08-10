import { Pool } from 'pg';

export type DbClient =
  | Pool
  | {
      query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
    };

const REQUIRED_SEASON_SCOPED_TABLES = [
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
];

const REQUIRED_SEASON_TABLES = ['seasons', ...REQUIRED_SEASON_SCOPED_TABLES];

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
}

/**
 * Ensures that all necessary database tables exist and are up to date.
 * Handles migrations (e.g. adding columns).
 */
export async function ensureSchema(db: DbClient) {
  // 1. Users Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT,
      color_index INTEGER DEFAULT 0
    )
  `);

  // 1b. Teams Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name TEXT,
      short_name TEXT,
      code TEXT,
      img TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'frozen', 'archived')),
      starts_at DATE,
      ends_at DATE,
      frozen_at TIMESTAMP,
      source_league_id TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    INSERT INTO seasons (id, name, status, frozen_at, notes)
    VALUES (
      '2025-26',
      'EuroLeague Fantasy 2025-26',
      'frozen',
      NOW(),
      'Canonical frozen snapshot created from the repaired production database.'
    )
    ON CONFLICT (id) DO NOTHING
  `);

  // 2. Players Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT,
      position TEXT,
      puntos INTEGER,
      partidos_jugados INTEGER,
      played_home INTEGER,
      played_away INTEGER,
      points_home INTEGER,
      points_away INTEGER,
      points_last_season INTEGER,
      owner_id TEXT,
      status TEXT,
      price_increment INTEGER,
      birth_date TEXT,
      height INTEGER,
      weight INTEGER,
      price INTEGER,
      euroleague_code TEXT,
      dorsal TEXT,
      country TEXT,
      team_id INTEGER,
      img TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS player_seasons (
      id SERIAL PRIMARY KEY,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      team_id INTEGER,
      owner_id TEXT,
      puntos INTEGER,
      partidos_jugados INTEGER,
      played_home INTEGER,
      played_away INTEGER,
      points_home INTEGER,
      points_away INTEGER,
      points_last_season INTEGER,
      status TEXT,
      price_increment INTEGER,
      price INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(season_id, player_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_seasons (
      id SERIAL PRIMARY KEY,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT,
      icon TEXT,
      color_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(season_id, user_id)
    )
  `);

  // 3. User Rounds Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_rounds (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      points INTEGER,
      participated BOOLEAN DEFAULT TRUE,
      alineacion TEXT,
      UNIQUE(user_id, round_id)
    )
  `);

  // 4. Fichajes (Transfers) Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS fichajes (
      id SERIAL PRIMARY KEY,
      timestamp BIGINT,
      fecha TEXT,
      player_id INTEGER,
      precio INTEGER,
      vendedor TEXT,
      comprador TEXT,
      UNIQUE(timestamp, player_id, vendedor, comprador, precio)
    )
  `);

  // 5. Lineups Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS lineups (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      player_id INTEGER,
      is_captain BOOLEAN,
      role TEXT,
      UNIQUE(user_id, round_id, player_id)
    )
  `);

  // 6. Matches Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      round_id INTEGER,
      round_name TEXT,
      home_id INTEGER,
      away_id INTEGER,
      date TIMESTAMP,
      status TEXT,
      home_score INTEGER,
      away_score INTEGER,
      home_score_regtime INTEGER,
      away_score_regtime INTEGER,
      home_q1 INTEGER,
      away_q1 INTEGER,
      home_q2 INTEGER,
      away_q2 INTEGER,
      home_q3 INTEGER,
      away_q3 INTEGER,
      home_q4 INTEGER,
      away_q4 INTEGER,
      home_ot INTEGER,
      away_ot INTEGER,
      UNIQUE(round_id, home_id, away_id)
    )
  `);

  // 7. Player Round Stats Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS player_round_stats (
      id SERIAL PRIMARY KEY,
      player_id INTEGER,
      round_id INTEGER,
      fantasy_points INTEGER,
      minutes INTEGER,
      points INTEGER,
      two_points_made INTEGER,
      two_points_attempted INTEGER,
      three_points_made INTEGER,
      three_points_attempted INTEGER,
      free_throws_made INTEGER,
      free_throws_attempted INTEGER,
      rebounds INTEGER,
      assists INTEGER,
      steals INTEGER,
      blocks INTEGER,
      turnovers INTEGER,
      fouls_committed INTEGER,
      valuation INTEGER,
      UNIQUE(player_id, round_id)
    )
  `);

  // 8. Porras Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS porras (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      result TEXT,
      aciertos INTEGER,
      UNIQUE(user_id, round_id)
    )
  `);

  // 9. Market Values Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS market_values (
      id SERIAL PRIMARY KEY,
      player_id INTEGER,
      price INTEGER,
      date DATE,
      UNIQUE(player_id, date)
    )
  `);

  // 10. Transfer Bids Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS transfer_bids (
      id SERIAL PRIMARY KEY,
      transfer_id INTEGER,
      bidder_id TEXT,
      bidder_name TEXT,
      amount INTEGER,
      CONSTRAINT fk_transfer FOREIGN KEY(transfer_id) REFERENCES fichajes(id) ON DELETE CASCADE
    )
  `);

  // 11. Initial Squads Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS initial_squads (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      player_id INTEGER,
      price INTEGER,
      UNIQUE(user_id, player_id)
    )
  `);

  // 12. Finances Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS finances (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      round_id INTEGER,
      date TEXT,
      type TEXT,
      amount INTEGER,
      description TEXT
    )
  `);

  // 13. Player Mappings Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS player_mappings (
      biwenger_id INTEGER PRIMARY KEY,
      euroleague_code TEXT NOT NULL,
      details_json TEXT
    )
  `);

  // 14. Sync Meta Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    )
  `);

  // 15. Tournaments Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournaments (
      internal_id SERIAL PRIMARY KEY,
      id INTEGER NOT NULL,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      league_id INTEGER,
      name TEXT,
      type TEXT,
      status TEXT,
      data_json TEXT,
      updated_at INTEGER,
      UNIQUE(season_id, id)
    )
  `);

  // 16. Tournament Phases Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_phases (
      id SERIAL PRIMARY KEY,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      tournament_id INTEGER,
      name TEXT,
      type TEXT,
      order_index INTEGER,
      FOREIGN KEY(season_id, tournament_id) REFERENCES tournaments(season_id, id) ON DELETE CASCADE,
      UNIQUE(season_id, tournament_id, order_index)
    )
  `);

  // 17. Tournament Fixtures Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_fixtures (
      internal_id SERIAL PRIMARY KEY,
      id INTEGER NOT NULL,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      tournament_id INTEGER,
      phase_id INTEGER REFERENCES tournament_phases(id) ON DELETE CASCADE,
      round_name TEXT,
      round_id INTEGER, -- Link to global round
      group_name TEXT,
      home_user_id TEXT,
      away_user_id TEXT,
      home_score INTEGER,
      away_score INTEGER,
      date INTEGER,
      status TEXT,
      FOREIGN KEY(season_id, tournament_id) REFERENCES tournaments(season_id, id) ON DELETE CASCADE,
      UNIQUE(season_id, tournament_id, id)
    )
  `);

  // 18. Tournament Standings Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_standings (
      id SERIAL PRIMARY KEY,
      season_id TEXT NOT NULL DEFAULT '2025-26' REFERENCES seasons(id),
      tournament_id INTEGER,
      phase_name TEXT,
      group_name TEXT,
      user_id TEXT,
      position INTEGER,
      points INTEGER,
      won INTEGER,
      lost INTEGER,
      drawn INTEGER,
      scored INTEGER,
      against INTEGER,
      FOREIGN KEY(season_id, tournament_id) REFERENCES tournaments(season_id, id) ON DELETE CASCADE,
      UNIQUE(season_id, tournament_id, phase_name, group_name, user_id)
    )
  `);

  // 19. Assistant Conversations Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS assistant_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // 20. Assistant Messages Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS assistant_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // --- INDEXES ---
  const indexes = [
    // User rounds
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_user_id ON user_rounds(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_round_id ON user_rounds(round_id DESC)',
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_user_round ON user_rounds(user_id, round_id)',

    // Player round stats
    'CREATE INDEX IF NOT EXISTS idx_player_round_stats_player_id ON player_round_stats(player_id)',
    'CREATE INDEX IF NOT EXISTS idx_player_round_stats_round_id ON player_round_stats(round_id DESC)',

    // Lineups
    'CREATE INDEX IF NOT EXISTS idx_lineups_user_id ON lineups(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_lineups_round_id ON lineups(round_id)',
    'CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON lineups(player_id)',

    // Fichajes
    'CREATE INDEX IF NOT EXISTS idx_fichajes_timestamp ON fichajes(timestamp DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fichajes_player_id ON fichajes(player_id)',

    // Market values
    'CREATE INDEX IF NOT EXISTS idx_market_values_player_id ON market_values(player_id)',
    'CREATE INDEX IF NOT EXISTS idx_market_values_date ON market_values(date DESC)',

    // Players
    'CREATE INDEX IF NOT EXISTS idx_players_owner_id ON players(owner_id)',
    'CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id)',
    'CREATE INDEX IF NOT EXISTS idx_players_position ON players(position)',
    'CREATE INDEX IF NOT EXISTS idx_players_puntos ON players(puntos DESC)',

    // Matches
    'CREATE INDEX IF NOT EXISTS idx_matches_round_id ON matches(round_id)',

    // Initial squads
    'CREATE INDEX IF NOT EXISTS idx_initial_squads_user_id ON initial_squads(user_id)',

    // Finances
    'CREATE INDEX IF NOT EXISTS idx_finances_user_id ON finances(user_id)',

    // Tournaments
    'CREATE INDEX IF NOT EXISTS idx_tournament_fixtures_tournament ON tournament_fixtures(tournament_id)',
    'CREATE INDEX IF NOT EXISTS idx_tournament_fixtures_round ON tournament_fixtures(round_id)',
    'CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament ON tournament_standings(tournament_id)',

    // Assistant
    'CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_updated ON assistant_conversations(user_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation_created ON assistant_messages(conversation_id, created_at)',
  ];

  for (const indexSql of indexes) {
    try {
      await db.query(indexSql);
    } catch (e: any) {
      // Index might already exist
      console.warn(`Index creation warning: ${e.message}`);
    }
  }

  const seasonScopedTables = [
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
  ];

  for (const table of seasonScopedTables) {
    const exists = await db.query('SELECT to_regclass($1) AS table_name', [`public.${table}`]);
    if (!exists.rows[0]?.table_name) continue;
    await db.query(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS season_id TEXT DEFAULT '2025-26'`
    );
  }
}
