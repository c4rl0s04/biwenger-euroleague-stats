/**
 * Ensures that all necessary database tables exist and are up to date.
 * Handles migrations (e.g. adding columns).
 * @param {import('pg').Pool} db - Postgres Database Pool
 */
export async function ensureSchema(db) {
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
      id INTEGER PRIMARY KEY,
      league_id INTEGER,
      name TEXT,
      type TEXT,
      status TEXT,
      data_json TEXT,
      updated_at INTEGER
    )
  `);

  // 16. Tournament Phases Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_phases (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT,
      type TEXT,
      order_index INTEGER,
      UNIQUE(tournament_id, order_index)
    )
  `);

  // 17. Tournament Fixtures Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_fixtures (
      id INTEGER PRIMARY KEY,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      phase_id INTEGER REFERENCES tournament_phases(id) ON DELETE CASCADE,
      round_name TEXT,
      round_id INTEGER, -- Link to global round
      group_name TEXT,
      home_user_id TEXT,
      away_user_id TEXT,
      home_score INTEGER,
      away_score INTEGER,
      date INTEGER,
      status TEXT
    )
  `);

  // 18. Tournament Standings Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_standings (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
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
      UNIQUE(tournament_id, phase_name, group_name, user_id)
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
  ];

  for (const indexSql of indexes) {
    try {
      await db.query(indexSql);
    } catch (e) {
      // Index might already exist
      console.warn(`Index creation warning: ${e.message}`);
    }
  }
}
