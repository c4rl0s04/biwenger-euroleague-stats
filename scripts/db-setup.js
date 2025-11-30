
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Updated paths for organized structure
const DB_PATH = path.join(process.cwd(), 'data', 'local.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'schema.sql');

function setupDatabase() {
  console.log(`Setting up database at ${DB_PATH}...`);
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Delete existing db if it exists to start fresh
  if (fs.existsSync(DB_PATH)) {
    console.log('Removing existing local.db...');
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    console.log('Applying schema...');
    db.exec(schema);
    console.log('Database initialized successfully (Schema Only).');
  } catch (err) {
    console.error('Error reading schema or initializing DB:', err);
  }

  db.close();
}

setupDatabase();
