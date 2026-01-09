/**
 * Ensures that all necessary database tables exist and are up to date.
 * Handles migrations (e.g. adding columns).
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export function ensureSchema(db) {
  // 1. Users Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT
    )
  `
  ).run();

  // 1b. Teams Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name TEXT,
      short_name TEXT,
      code TEXT,
      img TEXT
    )
  `
  ).run();

  // 2. Players Table (id is Biwenger player ID, not auto-increment)
  db.prepare(
    `
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
  `
  ).run();

  // 3. User Rounds Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS user_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      points INTEGER,
      participated BOOLEAN DEFAULT 1,
      alineacion TEXT,
      UNIQUE(user_id, round_id)
    )
  `
  ).run();

  // 4. Fichajes (Transfers) Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS fichajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      fecha TEXT,
      player_id INTEGER,
      precio INTEGER,
      vendedor TEXT,
      comprador TEXT,
      UNIQUE(timestamp, player_id, vendedor, comprador, precio)
    )
  `
  ).run();

  // 5. Lineups Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS lineups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      player_id INTEGER,
      is_captain BOOLEAN,
      role TEXT,
      UNIQUE(user_id, round_id, player_id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `
  ).run();

  // 6. Matches Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER,
      round_name TEXT,
      home_id INTEGER,
      away_id INTEGER,
      date DATE,
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
  `
  ).run();

  // 7. Player Round Stats Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS player_round_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      UNIQUE(player_id, round_id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `
  ).run();

  // 8. Porras Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS porras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      round_id INTEGER,
      round_name TEXT,
      result TEXT,
      aciertos INTEGER,
      UNIQUE(user_id, round_id)
    )
  `
  ).run();

  // 9. Market Values Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS market_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER,
      price INTEGER,
      date DATE,
      UNIQUE(player_id, date),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `
  ).run();

  // 10. Transfer Bids Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS transfer_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER,
      bidder_id TEXT,
      bidder_name TEXT,
      amount INTEGER,
      FOREIGN KEY(transfer_id) REFERENCES fichajes(id) ON DELETE CASCADE
    )
  `
  ).run();

  // 11. Initial Squads Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS initial_squads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      player_id INTEGER,
      price INTEGER,
      UNIQUE(user_id, player_id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `
  ).run();

  // 12. Finances Table (Bonuses, Rewards)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS finances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      round_id INTEGER,
      date TEXT,
      type TEXT,
      amount INTEGER,
      description TEXT
    )
  `
  ).run();

  // 13. Player Mappings Table (Linker)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS player_mappings (
      biwenger_id INTEGER PRIMARY KEY,
      euroleague_code TEXT NOT NULL,
      details_json TEXT
    )
  `
  ).run();

  // 14. Sync Meta Table (Dynamic Configuration)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    )
  `
  ).run();

  // --- INDEXES ---
  // Add indexes for common query patterns to improve performance
  const indexes = [
    // User rounds - frequently queried by user_id and sorted by round_id
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_user_id ON user_rounds(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_round_id ON user_rounds(round_id DESC)',
    'CREATE INDEX IF NOT EXISTS idx_user_rounds_user_round ON user_rounds(user_id, round_id)',

    // Player round stats - critical for player performance queries
    'CREATE INDEX IF NOT EXISTS idx_player_round_stats_player_id ON player_round_stats(player_id)',
    'CREATE INDEX IF NOT EXISTS idx_player_round_stats_round_id ON player_round_stats(round_id DESC)',

    // Lineups - user-specific lineup queries
    'CREATE INDEX IF NOT EXISTS idx_lineups_user_id ON lineups(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_lineups_round_id ON lineups(round_id)',
    'CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON lineups(player_id)',

    // Fichajes (transfers) - sorted by timestamp for recent activity
    'CREATE INDEX IF NOT EXISTS idx_fichajes_timestamp ON fichajes(timestamp DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fichajes_player_id ON fichajes(player_id)',

    // Market values - price history queries by player and date
    'CREATE INDEX IF NOT EXISTS idx_market_values_player_id ON market_values(player_id)',
    'CREATE INDEX IF NOT EXISTS idx_market_values_date ON market_values(date DESC)',

    // Players - common filters
    'CREATE INDEX IF NOT EXISTS idx_players_owner_id ON players(owner_id)',
    'CREATE INDEX IF NOT EXISTS idx_players_team ON players(team)',
    'CREATE INDEX IF NOT EXISTS idx_players_position ON players(position)',
    'CREATE INDEX IF NOT EXISTS idx_players_puntos ON players(puntos DESC)',

    // Matches - round-based queries
    'CREATE INDEX IF NOT EXISTS idx_matches_round_id ON matches(round_id)',

    // Initial squads - user squad queries
    'CREATE INDEX IF NOT EXISTS idx_initial_squads_user_id ON initial_squads(user_id)',

    // Finances - user finance history
    'CREATE INDEX IF NOT EXISTS idx_finances_user_id ON finances(user_id)',
  ];

  for (const indexSql of indexes) {
    try {
      db.prepare(indexSql).run();
    } catch (e) {
      // Index might already exist or column doesn't exist yet
    }
  }
}
