import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';

export class SyncManager {
  constructor(dbPath, flags = {}) {
    this.dbPath = dbPath;
    this.flags = flags;
    this.steps = [];
    this.context = {
      db: null,
      playersList: {},
      teams: {},
      competition: { data: { data: { players: {}, teams: {} } } },
      // Any other shared state can go here
    };
    this.logs = [];
    this.hasErrors = false;
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
    this.log('🚀 Starting Data Sync (Manager Mode)...');
    this.log(`   🔧 Config: ${JSON.stringify(this.flags, null, 2)}`);

    this.context.db = new Database(this.dbPath);

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
      if (this.context.db) {
        this.context.db.close();
        this.log('\n🔒 Database closed.');
      }
      this.log(`\n🏁 Sync finished ${this.hasErrors ? 'with errors ⚠️' : 'successfully ✅'}`);
    }
  }
}
