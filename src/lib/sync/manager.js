import { db } from '../db/client.js';
import { CONFIG } from '../config.js';
import { ensureSchema } from '../db/schema.js';
import { clearCache } from '../utils/cache';

export class SyncManager {
  constructor(dbPath) {
    this.dbPath = dbPath; // Unused for Postgres, kept for signature compat
    this.steps = [];
    this.context = {
      db: null, // Will hold the Postgres Pool
      playersList: {},
      teams: {},
      competition: { data: { data: { players: {}, teams: {} } } },
      // Any other shared state can go here
    };
    this.logs = [];
    this.hasErrors = false;
    this.roundNameMap = new Map(); // Store canonical round mapping (normalized name -> id)
  }

  /**
   * Helper to normalize round names (remove "aplazada")
   */
  normalizeRoundName(name) {
    if (!name) return '';
    return name.replace(/\s*\(aplazada\)\s*/i, '').trim();
  }

  /**
   * Resolves the canonical round ID for a given round.
   * If a round has a duplicate with a lower ID (the original round), returns that ID.
   * @param {Object} round - The round object (id, name)
   * @returns {number} The canonical round ID
   */
  resolveRoundId(round) {
    const baseName = this.normalizeRoundName(round.name);

    // If we have a canonical ID for this name, use it.
    // Logic: In Step 1 we will populate this map with the LOWEST ID for each name.
    if (this.roundNameMap.has(baseName)) {
      return this.roundNameMap.get(baseName);
    }

    // Fallback if map not populated (shouldn't happen if Step 1 runs)
    return round.id;
  }

  /**
   * Register a sync step
   * @param {string} name - Step name for logging
   * @param {Function} runFn - Async function (manager) => Promise<{success, message, data?}>
   */
  addStep(name, runFn) {
    this.steps.push({ name, runFn });
  }

  log(message) {
    console.log(message);
    this.logs.push({ type: 'info', message, timestamp: new Date() });
  }

  error(message, err) {
    console.error(message, err);
    this.logs.push({ type: 'error', message, error: err, timestamp: new Date() });
    this.hasErrors = true;
  }

  async run() {
    this.log('🚀 Starting Data Sync (Postgres Manager Mode)...');

    // Use the singleton pool from client.js
    this.context.db = db;

    // Ensure Schema Exists (Async now)
    this.log('   🔨 Verifying/Creating Database Schema...');
    try {
      await ensureSchema(this.context.db);
    } catch (e) {
      this.error('❌ Failed to verify schema:', e);
      process.exit(1);
    }

    try {
      for (const step of this.steps) {
        this.log(`\n▶️  Running Step: ${step.name}...`);
        try {
          const result = await step.runFn(this);

          if (result && result.message) {
            this.log(`   ${result.message}`);
          }

          if (result && result.success === false) {
            this.error(`❌ Step ${step.name} failed`, result.error || new Error('Unknown error'));
            // Depending on policy, we might break or continue
            // For now, continue but mark hasErrors
          } else {
            this.log(`✅ Step ${step.name} completed.`);
          }

          // Optionally merge result data into context if needed
          // But usually steps modify context.db or context.playersList directly
        } catch (err) {
          this.error(`❌ Critical Error in step ${step.name}:`, err);
        }
      }
    } catch (err) {
      this.error('❌ Sync Critical Failure:', err);
    } finally {
      // Clear in-memory cache after sync to invalidate stale data
      if (!this.hasErrors) {
        clearCache();
      }

      if (this.context.db && typeof this.context.db.end === 'function') {
        this.log('\n🔒 Closing Database connection...');
        await this.context.db.end();
        this.log('🔒 Database closed.');
      }
      this.log(`\n🏁 Sync finished ${this.hasErrors ? 'with errors ⚠️' : 'successfully ✅'}`);
    }
  }
}
