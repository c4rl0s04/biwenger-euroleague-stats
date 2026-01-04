/**
 * Cleanup script to merge duplicate rounds in the database.
 * Rounds with the same name (or with "(aplazada)" suffix) should be merged
 * into a single canonical round.
 */
import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';
import { prepareMatchMutations } from '../db/mutations/matches.js';

const DB_PATH = CONFIG.DB.PATH;

export function cleanupDuplicateRounds(db) {
  console.log('🧹 Cleaning up duplicate rounds...');

  // Initialize Mutations
  const mutations = prepareMatchMutations(db);

  const duplicates = mutations.findDuplicateRounds.all();

  if (duplicates.length === 0) {
    console.log('   No duplicate rounds found.');
    return;
  }

  console.log(`   Found ${duplicates.length} round(s) with duplicates to merge.`);

  for (const dup of duplicates) {
    const roundIds = dup.round_ids.split(',').map((id) => parseInt(id));
    const canonicalId = dup.canonical_id;
    const duplicateIds = roundIds.filter((id) => id !== canonicalId);

    console.log(`   Merging ${dup.base_name}: IDs ${duplicateIds.join(', ')} -> ${canonicalId}`);

    db.transaction(() => {
      for (const dupId of duplicateIds) {
        // Delete duplicate matches (they should have same data as canonical)
        mutations.deleteMatchesByRound.run(dupId);

        // Update player_round_stats - merge by updating round_id
        // First delete any conflicting entries (same player, same canonical round)
        mutations.deleteConflictingStats.run(dupId, canonicalId);

        // Then update remaining entries
        mutations.updateStatsRound.run(canonicalId, dupId);

        // Update user_rounds - merge points for same user/round
        // First, update points for users that have both rounds
        mutations.mergeUserRoundPoints.run(dupId, canonicalId);

        // Delete duplicate user_round entries
        mutations.deleteUserRounds.run(dupId);

        // Delete duplicate lineups (keep canonical)
        mutations.deleteLineups.run(dupId);
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
