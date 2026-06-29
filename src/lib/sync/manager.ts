import { db } from '../db/client';
import { ensureSchema } from '../db/schema_init';
import { clearCache } from '../utils/cache';
import { acquireAdvisoryLock, type AdvisoryLock } from './advisory-lock';
import { assertSyncSeasonWritable } from './season-guard';

export type SyncMode = 'full' | 'daily' | 'live';

export interface SyncStepResult {
  success?: boolean;
  message?: string;
  error?: unknown;
  data?: unknown;
}

export interface SyncStepMetadata {
  number: number;
  critical: boolean;
  dependencies: number[];
  modes: SyncMode[];
}

export interface SyncStep {
  name: string;
  runFn: (manager: SyncManager) => Promise<SyncStepResult | void>;
  metadata: SyncStepMetadata;
}

export interface SyncContext {
  db: typeof db | null;
  seasonId?: string;
  playersList: Record<string, any>;
  teams: Record<string, any>;
  competition: { data: { data: { players: Record<string, any>; teams: Record<string, any> } } };
  isDaily?: boolean;
  [key: string]: any;
}

export class SyncManager {
  dbPath: string;
  steps: SyncStep[];
  context: SyncContext;
  logs: { type: string; message: string; timestamp: Date; error?: any }[];
  hasErrors: boolean;
  roundNameMap: Map<string, number>;
  mode: SyncMode;
  continueOnError: boolean;
  useAdvisoryLock: boolean;
  lockKey: number;
  lockUnavailable: boolean;

  constructor(
    dbPath: string,
    options: {
      mode?: SyncMode;
      continueOnError?: boolean;
      useAdvisoryLock?: boolean;
      lockKey?: number;
    } = {}
  ) {
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
    this.mode = options.mode ?? 'full';
    this.continueOnError = options.continueOnError ?? process.env.SYNC_CONTINUE_ON_ERROR === 'true';
    this.useAdvisoryLock = options.useAdvisoryLock ?? true;
    this.lockKey = options.lockKey ?? 823744;
    this.lockUnavailable = false;
  }

  /**
   * Helper to normalize round names (remove "aplazada", etc.)
   */
  normalizeRoundName(name: string | undefined): string {
    if (!name) return '';
    return name
      .replace(/\s*\(aplazada\)\s*/i, '')
      .replace(/\s*Playoff\s*/i, '')
      .replace(/\s*Eliminatoria\s*/i, 'Eliminatoria')
      .replace(/\s*Final Four\s*/i, 'Final Four')
      .trim();
  }

  /**
   * Resolves the canonical round ID for a given round.
   * If a round has a duplicate with a lower ID (the original round), returns that ID.
   * @param round - The round object (id, name)
   * @returns The canonical round ID
   */
  resolveRoundId(round: { id: number; name: string }): number {
    const baseName = this.normalizeRoundName(round.name);

    // If we have a canonical ID for this name, use it.
    // Logic: In Step 1 we will populate this map with the LOWEST ID for each name.
    // We only want to canonicalize 'Jornada' rounds (to group postponed matches).
    // Playoff rounds ('Eliminatoria', 'Final Four') have the exact same name but are distinct rounds (e.g., Game 1, Game 2).
    if (baseName.includes('Jornada') && this.roundNameMap.has(baseName)) {
      return this.roundNameMap.get(baseName)!;
    }

    // Fallback if map not populated (shouldn't happen if Step 1 runs) or if it's a playoff round
    return round.id;
  }

  /**
   * Register a sync step
   * @param name - Step name for logging
   * @param runFn - Async function (manager) => Promise<{success, message, data?}>
   */
  addStep(name: string, runFn: SyncStep['runFn'], metadata: Partial<SyncStepMetadata> = {}) {
    this.steps.push({
      name,
      runFn,
      metadata: {
        number: metadata.number ?? this.steps.length + 1,
        critical: metadata.critical ?? true,
        dependencies: metadata.dependencies ?? [],
        modes: metadata.modes ?? ['full', 'daily', 'live'],
      },
    });
  }

  log(message: string) {
    console.log(message);
    this.logs.push({ type: 'info', message, timestamp: new Date() });
  }

  error(message: string, err?: any) {
    console.error(message, err);
    this.logs.push({ type: 'error', message, error: err, timestamp: new Date() });
    this.hasErrors = true;
  }

  async run() {
    this.log('🚀 Starting Data Sync (Postgres Manager Mode)...');
    let advisoryLock: AdvisoryLock | null = null;

    // Use the singleton pool from client.js
    this.context.db = db;

    if (this.useAdvisoryLock) {
      advisoryLock = await acquireAdvisoryLock(this.context.db as any, this.lockKey, this.mode);
      if (!advisoryLock.acquired) {
        this.lockUnavailable = true;
        this.log('⏭️  Another sync is already running. Skipping this run.');
        return;
      }
    }

    // Ensure Schema Exists (Async now)
    this.log('   🔨 Verifying/Creating Database Schema...');
    try {
      await ensureSchema(this.context.db as any);
      const seasonContext = await assertSyncSeasonWritable(this.context.db as any);
      this.context.seasonId = seasonContext.seasonId;
      this.log(`   🗓️ Sync season resolved: ${seasonContext.seasonId} (${seasonContext.status}).`);
    } catch (e) {
      this.error('❌ Failed to verify writable sync season:', e);
      if (advisoryLock?.acquired) {
        await advisoryLock.release();
      }
      if (this.context.db && typeof this.context.db.end === 'function') {
        await this.context.db.end();
      }
      return;
    }

    try {
      for (const step of this.steps) {
        if (!step.metadata.modes.includes(this.mode)) {
          this.log(
            `\n⏭️  Skipping Step ${step.metadata.number}: ${step.name} for ${this.mode} mode.`
          );
          continue;
        }

        this.log(`\n▶️  Running Step ${step.metadata.number}: ${step.name}...`);
        try {
          const result = await step.runFn(this);

          if (result && result.message) {
            this.log(`   ${result.message}`);
          }

          if (result && result.success === false) {
            this.error(`❌ Step ${step.name} failed`, result.error || new Error('Unknown error'));
            if (step.metadata.critical && !this.continueOnError) {
              this.log(`🛑 Stopping sync because critical step ${step.metadata.number} failed.`);
              break;
            }
          } else {
            this.log(`✅ Step ${step.name} completed.`);
          }

          // Optionally merge result data into context if needed
          // But usually steps modify context.db or context.playersList directly
        } catch (err) {
          this.error(`❌ Critical Error in step ${step.name}:`, err);
          if (step.metadata.critical && !this.continueOnError) {
            this.log(`🛑 Stopping sync because critical step ${step.metadata.number} threw.`);
            break;
          }
        }
      }
    } catch (err) {
      this.error('❌ Sync Critical Failure:', err);
    } finally {
      // Clear in-memory cache after sync to invalidate stale data
      if (!this.hasErrors) {
        clearCache();
      }

      if (advisoryLock?.acquired) {
        await advisoryLock.release();
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
