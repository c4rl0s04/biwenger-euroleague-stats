/**
 * Database access layer using better-sqlite3
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Connect to the LOCAL database
const dbPath = process.env.DB_PATH || 'data/local.db';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
