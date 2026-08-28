import { getEuroleagueClient } from '../api/euroleague/runtime';
import { db } from '../db/client';
import { ensureSchema, validateSchemaReady } from '../db/schema_init';
import { clearCache } from '../utils/cache';
import { acquireAdvisoryLock, type AdvisoryLock } from './advisory-lock';
import {
  parseBiwengerCompetition,
  type BiwengerCompetitionSnapshot,
  type SyncExecutionContext,
} from './context';
import {
  canonicalRoundIds,
  normalizeRoundName,
  resolveRoundId,
  type BiwengerRound,
} from './rounds';
import { assertSyncSeasonWritable } from './season-guard';

export type SyncMode = 'routine' | 'bootstrap' | 'live';
export type SyncSource = 'biwenger' | 'euroleague' | 'database' | 'biwenger+database';

export interface SyncStepResult {
  summary: string;
  counts?: Record<string, number>;
  warnings?: string[];
}

export interface SyncStepDefinition {
  id: string;
  title: string;
  source: SyncSource;
  writes: readonly string[];
  modes: readonly SyncMode[];
  dependencies: readonly string[];
  run: (manager: SyncManager) => Promise<SyncStepResult | void>;
}

export class SyncManager {
  readonly steps: SyncStepDefinition[] = [];
  readonly context: SyncExecutionContext;
  readonly logs: { type: string; message: string; timestamp: Date; error?: unknown }[] = [];
  readonly mode: SyncMode;
  readonly useAdvisoryLock: boolean;
  readonly lockKey: number;
  readonly forceGame?: number;
  hasErrors = false;
  lockUnavailable = false;
  private roundIds = new Map<string, number>();

  constructor(
    options: {
      mode?: SyncMode;
      useAdvisoryLock?: boolean;
      lockKey?: number;
      forceGame?: number;
    } = {}
  ) {
    this.mode = options.mode ?? 'routine';
    this.useAdvisoryLock = options.useAdvisoryLock ?? true;
    this.lockKey = options.lockKey ?? 823744;
    this.forceGame = options.forceGame;
    this.context = { db: null, euroleague: getEuroleagueClient() };
  }

  addStep(step: SyncStepDefinition): void {
    this.steps.push(step);
  }

  setBiwengerCompetition(raw: unknown): BiwengerCompetitionSnapshot {
    const snapshot = parseBiwengerCompetition(raw);
    this.context.biwenger = snapshot;
    this.roundIds = canonicalRoundIds(snapshot.rounds);
    return snapshot;
  }

  async getBiwengerCompetition(): Promise<BiwengerCompetitionSnapshot> {
    if (this.context.biwenger) return this.context.biwenger;
    const { fetchCompetition } = await import('../api/biwenger-client');
    return this.setBiwengerCompetition(await fetchCompetition());
  }

  normalizeRoundName(name: string | undefined): string {
    return normalizeRoundName(name);
  }

  resolveRoundId(round: Pick<BiwengerRound, 'id' | 'name'>): number {
    return resolveRoundId(round, this.roundIds);
  }

  log(message: string): void {
    console.log(message);
    this.logs.push({ type: 'info', message, timestamp: new Date() });
  }

  error(message: string, error?: unknown): void {
    console.error(message, error);
    this.logs.push({ type: 'error', message, error, timestamp: new Date() });
    this.hasErrors = true;
  }

  async run(): Promise<void> {
    this.log(`🚀 Starting ${this.mode} data sync...`);
    let advisoryLock: AdvisoryLock | null = null;
    this.context.db = db;

    if (this.useAdvisoryLock) {
      advisoryLock = await acquireAdvisoryLock(db as any, this.lockKey, this.mode);
      if (!advisoryLock.acquired) {
        this.lockUnavailable = true;
        this.log('⏭️ Another synchronization is already running. Skipping this run.');
        return;
      }
    }

    try {
      const allowBootstrap =
        process.env.NODE_ENV !== 'production' || process.env.ALLOW_SCHEMA_BOOTSTRAP === 'true';
      if (allowBootstrap) await ensureSchema(db as any);
      await validateSchemaReady(db as any);

      const season = await assertSyncSeasonWritable(db as any);
      this.context.seasonId = season.seasonId;
      this.log(`🗓️ Writable season: ${season.seasonId} (${season.status}).`);

      for (const step of this.steps) {
        const startedAt = Date.now();
        this.log(`\n▶️ ${step.id}: ${step.title}`);
        this.log(`   Source: ${step.source}; writes: ${step.writes.join(', ') || 'none'}`);
        try {
          const result = await step.run(this);
          const durationMs = Date.now() - startedAt;
          if (result?.summary) this.log(`   ${result.summary}`);
          if (result?.counts) this.log(`   Counts: ${JSON.stringify(result.counts)}`);
          for (const warning of result?.warnings || []) this.log(`   ⚠️ ${warning}`);
          this.log(`✅ ${step.id} completed in ${durationMs}ms.`);
        } catch (error) {
          this.error(`❌ ${step.id} failed.`, error);
          break;
        }
      }
    } catch (error) {
      this.error('❌ Synchronization preconditions failed.', error);
    } finally {
      if (!this.hasErrors) clearCache();
      if (advisoryLock?.acquired) await advisoryLock.release();
      if (this.context.db && typeof this.context.db.end === 'function') {
        await this.context.db.end();
      }
      this.log(`\n🏁 Sync finished ${this.hasErrors ? 'with errors' : 'successfully'}.`);
    }
  }
}
