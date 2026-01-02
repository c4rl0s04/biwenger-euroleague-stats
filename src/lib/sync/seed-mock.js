import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Database is in project_root/data/local.db
// This file is in src/lib/sync/
// So ../../../data/local.db
const DB_PATH = path.resolve(__dirname, '../../../data/local.db');
import { ensureSchema } from '../db/schema.js';
import { getShortTeamName } from '../utils/format.js';

console.log(`🔌 Connecting to database at ${DB_PATH}...`);
const db = new Database(DB_PATH);

function seedMockData() {
  console.log('🌱 Seeding Mock Data...');
  
  // 0. Ensure Schema (Add missing columns like valuation)
  ensureSchema(db);

  // 1. Mock 'valuation' (PIR) for existing stats
  // We'll base it on fantasy_points roughly
  const stats = db.prepare('SELECT id, fantasy_points FROM player_round_stats WHERE valuation IS NULL').all();
  
  const updateValuation = db.prepare('UPDATE player_round_stats SET valuation = @val WHERE id = @id');
  
  let updatedStats = 0;
  db.transaction(() => {
    for (const stat of stats) {
      // Mock: Valuation is usually close to fantasy points but slightly different
      // Random variance between -5 and +5
      const variance = Math.floor(Math.random() * 11) - 5; 
      const mockVal = Math.max(0, (stat.fantasy_points || 0) + variance);
      
      updateValuation.run({ val: mockVal, id: stat.id });
      updatedStats++;
    }
  })();
  if (updatedStats > 0) {
      console.log(`✅ Updated ${updatedStats} stats with mock Valuation (PIR).`);
  } else {
      console.log(`ℹ️ No stats needed Valuation update (all good or empty).`);
  }

  // 2. Mock 'euroleague_code' for Players
  // Just assign a placeholder for top players so links might work (visually)
  const players = db.prepare('SELECT id FROM players WHERE euroleague_code IS NULL LIMIT 50').all();
  const updateCode = db.prepare('UPDATE players SET euroleague_code = @code WHERE id = @id');
  
  db.transaction(() => {
    for (const p of players) {
      updateCode.run({ code: `P${p.id}`, id: p.id });
    }
  })();
  if (players.length > 0) {
    console.log(`✅ Assigned mock Euroleague IDs to ${players.length} players.`);
  }

  // 3. Ensure some Matches have Euroleague-style scores if missing
  // (Biwenger sync usually provides them, but ensuring standard format)
  const matches = db.prepare('SELECT rowid, home_score, away_score FROM matches WHERE home_score IS NULL').all();
  const updateMatch = db.prepare("UPDATE matches SET home_score = @h, away_score = @a, status = 'finished' WHERE rowid = @id");
  
  db.transaction(() => {
    for (const m of matches) {
      const h = 70 + Math.floor(Math.random() * 30); // 70-99
      const a = 70 + Math.floor(Math.random() * 30);
      updateMatch.run({ h, a, id: m.rowid });
    }
  })();
  
  // 4. Mock 'teams' Table & IDs
  // Extract unique teams from Matches
  const teamsList = db.prepare(`
    SELECT DISTINCT home_team as name FROM matches 
    UNION 
    SELECT DISTINCT away_team as name FROM matches
  `).all();
  
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, short_name, img) VALUES (@id, @name, @short_name, @img)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, img=excluded.img
  `);
  const updateMatchIDs = db.prepare('UPDATE matches SET home_id = @hid, away_id = @aid WHERE rowid = @id');
  
  // Create a map to cache generated IDs
  const teamMap = {};
  
  db.transaction(() => {
    // Simple map for mocks to avoid importing utils


    let mockIdCounter = 1000;
    for (const t of teamsList) {
        if (!t.name) continue;
        const id = mockIdCounter++;
        teamMap[t.name] = id;
        
        insertTeam.run({
            id: id,
            name: t.name,
            short_name: getShortTeamName(t.name),
            img: `https://cdn.biwenger.com/teams/${Math.floor(Math.random() * 20)+1}.png`
        });
    }
    
    // Update Matches with these IDs
    const matchesToUpdate = db.prepare('SELECT rowid, home_team, away_team FROM matches WHERE home_id IS NULL OR away_id IS NULL').all();
    for (const m of matchesToUpdate) {
        updateMatchIDs.run({
            hid: teamMap[m.home_team] || null,
            aid: teamMap[m.away_team] || null,
            id: m.rowid
        });
    }
    
    if (matchesToUpdate.length > 0) {
        console.log(`✅ Backfilled team IDs for ${matchesToUpdate.length} matches.`);
    }
  })();

  console.log(`✅ Seeded ${teamsList.length} unique teams from match history.`);

  if (matches.length > 0) {
    console.log(`✅ Mocked results for ${matches.length} matches.`);
  } else {
      console.log('ℹ️ All matches already have scores.');
  }

  console.log('🎉 Mock Data Seeding Complete! You can now develop offline.');
}

try {
  seedMockData();
} catch (error) {
  console.error('❌ Error seeding data:', error);
} finally {
  db.close();
}
