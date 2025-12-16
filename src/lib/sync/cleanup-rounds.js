/**
 * Cleanup script to merge duplicate rounds in the database.
 * Rounds with the same name (or with "(aplazada)" suffix) should be merged
 * into a single canonical round.
 */
import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';

const DB_PATH = CONFIG.DB.PATH;

export function cleanupDuplicateRounds(db) {
  console.log('🧹 Cleaning up duplicate rounds...');
  
  // Find duplicate round names (including aplazada variations)
  const duplicatesQuery = `
    SELECT 
      CASE 
        WHEN round_name LIKE '%(aplazada)%' THEN TRIM(REPLACE(round_name, '(aplazada)', ''))
        ELSE round_name
      END as base_name,
      GROUP_CONCAT(DISTINCT round_id) as round_ids,
      MIN(round_id) as canonical_id,
      COUNT(DISTINCT round_id) as count
    FROM matches
    GROUP BY base_name
    HAVING count > 1
  `;
  
  const duplicates = db.prepare(duplicatesQuery).all();
  
  if (duplicates.length === 0) {
    console.log('   No duplicate rounds found.');
    return;
  }
  
  console.log(`   Found ${duplicates.length} round(s) with duplicates to merge.`);
  
  for (const dup of duplicates) {
    const roundIds = dup.round_ids.split(',').map(id => parseInt(id));
    const canonicalId = dup.canonical_id;
    const duplicateIds = roundIds.filter(id => id !== canonicalId);
    
    console.log(`   Merging ${dup.base_name}: IDs ${duplicateIds.join(', ')} -> ${canonicalId}`);
    
    db.transaction(() => {
      for (const dupId of duplicateIds) {
        // Delete duplicate matches (they should have same data as canonical)
        db.prepare(`
          DELETE FROM matches WHERE round_id = ?
        `).run(dupId);
        
        // Update player_round_stats - merge by updating round_id
        // First delete any conflicting entries (same player, same canonical round)
        db.prepare(`
          DELETE FROM player_round_stats 
          WHERE round_id = ? 
          AND player_id IN (
            SELECT player_id FROM player_round_stats WHERE round_id = ?
          )
        `).run(dupId, canonicalId);
        
        // Then update remaining entries
        db.prepare(`
          UPDATE player_round_stats SET round_id = ?
          WHERE round_id = ?
        `).run(canonicalId, dupId);
        
        // Update user_rounds - merge points for same user/round
        // First, update points for users that have both rounds
        db.prepare(`
          UPDATE user_rounds 
          SET points = points + COALESCE((
            SELECT points FROM user_rounds ur2 
            WHERE ur2.user_id = user_rounds.user_id AND ur2.round_id = ?
          ), 0)
          WHERE round_id = ?
        `).run(dupId, canonicalId);
        
        // Delete duplicate user_round entries
        db.prepare(`
          DELETE FROM user_rounds WHERE round_id = ?
        `).run(dupId);
        
        // Delete duplicate lineups (keep canonical)
        db.prepare(`
          DELETE FROM lineups WHERE round_id = ?
        `).run(dupId);
      }
    })();
  }
  
  console.log('   ✅ Duplicate rounds merged successfully.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = new Database(DB_PATH);
  try {
    cleanupDuplicateRounds(db);
  } finally {
    db.close();
  }
}
