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

    db.prepare(`
      CREATE TABLE IF NOT EXISTS lineups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        round_id INTEGER,
        round_name TEXT,
        player_id INTEGER,
        is_captain BOOLEAN,
        points INTEGER,
        UNIQUE(user_id, round_id, player_id),
        FOREIGN KEY(player_id) REFERENCES players(id)
      )
    `).run();

    // Create users table if not exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `).run();

    // Create user_rounds table if not exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        round_name TEXT,
        points INTEGER,
        participated BOOLEAN DEFAULT 1,
        UNIQUE(user_id, round_name)
      )
    `).run();
}
