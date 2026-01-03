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
      team TEXT,
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
      euroleague_code TEXT
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
      home_team TEXT,
      away_team TEXT,
      date DATE,
      status TEXT,
      home_score INTEGER,
      away_score INTEGER,
      UNIQUE(round_id, home_team, away_team)
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

  // --- MIGRATIONS ---
  // Apply specific migrations that might be needed for existing databases

  // Migration: Add owner_id, status, price_increment, etc. to players
  const playerCols = [
    'owner_id',
    'status',
    'price_increment',
    'birth_date',
    'height',
    'weight',
    'price',
    'euroleague_code',
  ];
  const playersInfo = db.prepare('PRAGMA table_info(players)').all();
  const existingPlayerCols = new Set(playersInfo.map((c) => c.name));

  for (const col of playerCols) {
    if (!existingPlayerCols.has(col)) {
      console.log(`Migrating players table (adding ${col} column)...`);
      let type = 'TEXT';
      if (['price_increment', 'height', 'weight', 'price'].includes(col)) {
        type = 'INTEGER';
      }
      try {
        db.prepare(`ALTER TABLE players ADD COLUMN ${col} ${type}`).run();
      } catch (e) {
        console.warn(`Could not add column ${col} to players: ${e.message}`);
      }
    }
  }

  // Migration: Add icon to users
  const usersInfo = db.prepare('PRAGMA table_info(users)').all();
  if (!usersInfo.some((c) => c.name === 'icon')) {
    console.log('Migrating users table (adding icon column)...');
    try {
      db.prepare('ALTER TABLE users ADD COLUMN icon TEXT').run();
    } catch (e) {}
  }

  // Migration: Add valuation to player_round_stats
  const statsInfo = db.prepare('PRAGMA table_info(player_round_stats)').all();
  if (!statsInfo.some((c) => c.name === 'valuation')) {
    console.log('Migrating player_round_stats table (adding valuation column)...');
    try {
      db.prepare('ALTER TABLE player_round_stats ADD COLUMN valuation INTEGER').run();
    } catch (e) {}
  }

  // Migration: Add home_id/away_id to matches
  const matchesInfo = db.prepare('PRAGMA table_info(matches)').all();
  if (!matchesInfo.some((c) => c.name === 'home_id')) {
    console.log('Migrating matches table (adding team IDs)...');
    try {
      db.prepare('ALTER TABLE matches ADD COLUMN home_id INTEGER').run();
      db.prepare('ALTER TABLE matches ADD COLUMN away_id INTEGER').run();
    } catch (e) {}
  }

  // Migration: Add team_id to players
  const playersInfoChecks = db.prepare('PRAGMA table_info(players)').all();
  if (!playersInfoChecks.some((c) => c.name === 'team_id')) {
    console.log('Migrating players table (adding team_id)...');
    try {
      db.prepare('ALTER TABLE players ADD COLUMN team_id INTEGER').run();
    } catch (e) {}
  }

  // Migration: Check for round_id in lineups
  const lineupsInfo = db.prepare('PRAGMA table_info(lineups)').all();
  if (!lineupsInfo.some((c) => c.name === 'round_id')) {
    console.log('Migrating lineups table (resetting for schema update)...');
    // Drop logic avoided for brevity unless strictly necessary, but better to add column
    // For simplicity, we assume schema is mostly stable or use ensureSchema logic if needed
    // The previous ensure-schema.js did DROP TABLE for some changes.
    // Ideally we ALTER TABLE ADD COLUMN.
    try {
      db.prepare('ALTER TABLE lineups ADD COLUMN round_id INTEGER').run();
      db.prepare('ALTER TABLE lineups ADD COLUMN round_name TEXT').run();
    } catch (e) {}
  }

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

  // Migration: Add short_name to teams
  // Migration: Add short_name and code to teams
  const teamsInfo = db.prepare('PRAGMA table_info(teams)').all();

  if (!teamsInfo.some((c) => c.name === 'short_name')) {
    console.log('Migrating teams table (adding short_name)...');
    try {
      db.prepare('ALTER TABLE teams ADD COLUMN short_name TEXT').run();
    } catch (e) {}
  }

  if (!teamsInfo.some((c) => c.name === 'code')) {
    console.log('Migrating teams table (adding Euroleague code column)...');
    try {
      db.prepare('ALTER TABLE teams ADD COLUMN code TEXT').run();
    } catch (e) {}
  }
}
