/**
 * Ensures that all necessary database tables exist and are up to date.
 * Handles migrations (e.g. adding round_id to lineups).
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export function ensureSchema(db) {
    // Check if lineups table has round_id column (migration check)
    let hasRoundId = false;
    try {
        const tableInfo = db.prepare("PRAGMA table_info(lineups)").all();
        hasRoundId = tableInfo.some(c => c.name === 'round_id');
    } catch (e) {}

    if (!hasRoundId) {
        console.log('   Migrating lineups table to include round_id...');
        db.prepare('DROP TABLE IF EXISTS lineups').run();
    }

    // Check if matches table has round_id column (migration check)
    let matchesHasRoundId = false;
    try {
        const tableInfo = db.prepare("PRAGMA table_info(matches)").all();
        matchesHasRoundId = tableInfo.some(c => c.name === 'round_id');
    } catch (e) {}

    if (!matchesHasRoundId) {
        console.log('   Migrating matches table to include round_id...');
        db.prepare('DROP TABLE IF EXISTS matches').run();
    }
    
    db.prepare(`
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
    `).run();

    // Check if lineups table has role column (migration check)
    let lineupsHasRole = false;
    try {
        const tableInfo = db.prepare("PRAGMA table_info(lineups)").all();
        lineupsHasRole = tableInfo.some(c => c.name === 'role');
    } catch (e) {}

    if (!lineupsHasRole) {
        console.log('   Migrating lineups table to include role...');
        db.prepare('DROP TABLE IF EXISTS lineups').run();
    }

    // Check if lineups table has points column (deprecated)
    let lineupsHasPoints = false;
    try {
        const info = db.prepare("PRAGMA table_info(lineups)").all();
        lineupsHasPoints = info.some(col => col.name === 'points');
    } catch (e) {}

    if (lineupsHasPoints) {
        console.log('   Migrating lineups table (removing points column)...');
        db.prepare('DROP TABLE IF EXISTS lineups').run();
    }

    db.prepare(`
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
    `).run();

    // Create transfer_bids table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS transfer_bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER,
        bidder_id TEXT,
        bidder_name TEXT,
        amount INTEGER,
        FOREIGN KEY(transfer_id) REFERENCES fichajes(id) ON DELETE CASCADE
      )
    `).run();

    // Create users table if not exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `).run();

    // Check if user_rounds table has alineacion column (migration check)
    let userRoundsHasAlineacion = false;
    try {
        const tableInfo = db.prepare("PRAGMA table_info(user_rounds)").all();
        userRoundsHasAlineacion = tableInfo.some(c => c.name === 'alineacion');
    } catch (e) {}

    if (!userRoundsHasAlineacion) {
        console.log('   Migrating user_rounds table to include alineacion...');
        db.prepare('DROP TABLE IF EXISTS user_rounds').run();
    }

    // Create players table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        position TEXT,
        team TEXT,
        puntos INTEGER,
        partidos_jugados INTEGER,
        played_home INTEGER,
        played_away INTEGER,
        points_home INTEGER,
        points_away INTEGER,
        points_last_season INTEGER,
        owner_id TEXT
      )
    `).run();

    // Check if players table has owner_id column (migration check)
    let playersHasOwnerId = false;
    try {
        const info = db.prepare("PRAGMA table_info(players)").all();
        playersHasOwnerId = info.some(col => col.name === 'owner_id');
    } catch (e) {}

    if (!playersHasOwnerId) {
        console.log('Migrating players table (adding owner_id column)...');
        try {
            db.prepare('ALTER TABLE players ADD COLUMN owner_id TEXT').run();
        } catch (e) {
            console.log('Column owner_id likely already exists or error adding it:', e.message);
        }
    }

    // Check for new player columns (img_url, status, price_increment)
    const playerCols = ['img_url', 'status', 'price_increment'];
    try {
        const info = db.prepare("PRAGMA table_info(players)").all();
        const existingCols = new Set(info.map(c => c.name));
        
        for (const col of playerCols) {
            if (!existingCols.has(col)) {
                console.log(`Migrating players table (adding ${col} column)...`);
                let type = col === 'price_increment' ? 'INTEGER' : 'TEXT';
                db.prepare(`ALTER TABLE players ADD COLUMN ${col} ${type}`).run();
            }
        }
    } catch (e) {
        console.log('Error migrating players table:', e.message);
    }

    // Create users table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        icon TEXT
      )
    `).run();

    // Check if users table has icon column
    let usersHasIcon = false;
    try {
        const info = db.prepare("PRAGMA table_info(users)").all();
        usersHasIcon = info.some(col => col.name === 'icon');
    } catch (e) {}

    if (!usersHasIcon) {
        console.log('Migrating users table (adding icon column)...');
        try {
            db.prepare('ALTER TABLE users ADD COLUMN icon TEXT').run();
        } catch (e) {
            console.log('Column icon likely already exists or error adding it:', e.message);
        }
    }

    // Create player_round_stats table
    db.prepare(`
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
        UNIQUE(player_id, round_id),
        FOREIGN KEY(player_id) REFERENCES players(id)
      )
    `).run();

    // Check if porras table has round_id column (migration check)
    let porrasHasRoundId = false;
    try {
        const tableInfo = db.prepare("PRAGMA table_info(porras)").all();
        porrasHasRoundId = tableInfo.some(c => c.name === 'round_id');
    } catch (e) {}

    if (!porrasHasRoundId) {
        console.log('   Migrating porras table to new schema...');
        db.prepare('DROP TABLE IF EXISTS porras').run();
    }

    // Create porras table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS porras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        round_id INTEGER,
        round_name TEXT,
        result TEXT,
        aciertos INTEGER,
        UNIQUE(user_id, round_id)
      )
    `).run();

    // Create user_rounds table if not exists
    db.prepare(`
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
    `).run();
}
