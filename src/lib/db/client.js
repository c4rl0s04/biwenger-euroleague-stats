/**
 * Database access layer using better-sqlite3
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { CONFIG } from '../config.js';

// Connect to the LOCAL database
const dbPath = CONFIG.DB.PATH;

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
