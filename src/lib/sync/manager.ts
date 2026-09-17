import { getEuroleagueClient } from '../api/euroleague/runtime';
import { pool } from '../db/client';
import { validateSchemaReady } from '../db/schema-validation';
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
import { SyncReporter, type ReporterWriter } from './reporter';

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
  readonly targetSeasonId?: string;
  readonly reporter: SyncReporter;
  hasErrors = false;
  lockUnavailable = false;
  warningsCount = 0;
  private currentStepWarnings: string[] = [];
  private roundIds = new Map<string, number>();

  constructor(
    options: {
      mode?: SyncMode;
      useAdvisoryLock?: boolean;
      lockKey?: number;
      forceGame?: number;
      seasonId?: string;
      reporter?: SyncReporter;
      writer?: ReporterWriter;
    } = {}
  ) {
    this.mode = options.mode ?? 'routine';
    this.useAdvisoryLock = options.useAdvisoryLock ?? true;
    this.lockKey = options.lockKey ?? 823744;
    this.forceGame = options.forceGame;
    this.targetSeasonId = options.seasonId;
    this.context = { db: null, euroleague: getEuroleagueClient() };
    this.reporter = options.reporter ?? new SyncReporter({ writer: options.writer });
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
    this.logs.push({ type: 'info', message, timestamp: new Date() });
    this.reporter.stepDetail(message);
  }

  warn(message: string): void {
    this.logs.push({ type: 'warning', message, timestamp: new Date() });
    this.currentStepWarnings.push(message);
    this.warningsCount++;
    this.reporter.stepWarning(message);
  }

  error(message: string, error?: unknown): void {
    this.logs.push({ type: 'error', message, error, timestamp: new Date() });
    this.hasErrors = true;
  }

  async run(): Promise<void> {
    const startedAt = Date.now();
    this.reporter.runStarted({ mode: this.mode, totalSteps: this.steps.length });
    this.logs.push({
      type: 'info',
      message: `Starting ${this.mode} data sync...`,
      timestamp: new Date(),
    });
    let advisoryLock: AdvisoryLock | null = null;
    this.context.db = pool;

    if (this.useAdvisoryLock) {
      advisoryLock = await acquireAdvisoryLock(pool, this.lockKey, this.mode);
      if (!advisoryLock.acquired) {
        this.lockUnavailable = true;
        this.reporter.runSkipped({ reason: 'Another synchronization is already running' });
        this.logs.push({
          type: 'info',
          message: 'Another synchronization is already running. Skipping this run.',
          timestamp: new Date(),
        });
        return;
      }
    }

    let completedStepsCount = 0;
    let failedStep: SyncStepDefinition | null = null;
    this.warningsCount = 0;
    this.currentStepWarnings = [];

    try {
      await validateSchemaReady(pool);

      const season = await assertSyncSeasonWritable(pool, this.targetSeasonId);
      this.context.season = season;
      this.context.seasonId = season.seasonId;
      this.reporter.seasonResolved({
        seasonId: season.seasonId,
        status: season.status,
        euroleagueCode: season.euroleagueCode,
      });
      this.logs.push({
        type: 'info',
        message: `Writable season: ${season.seasonId} (${season.status}) [euroleague: ${season.euroleagueCode}].`,
        timestamp: new Date(),
      });

      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepStartedAt = Date.now();
        this.currentStepWarnings = [];
        this.reporter.stepStarted({
          index: i + 1,
          total: this.steps.length,
          step,
        });
        this.logs.push({
          type: 'info',
          message: `${step.id}: ${step.title}`,
          timestamp: new Date(),
        });
        this.logs.push({
          type: 'info',
          message: `Source: ${step.source}; writes: ${step.writes.join(', ') || 'none'}`,
          timestamp: new Date(),
        });

        try {
          const result = await step.run(this);
          const durationMs = Date.now() - stepStartedAt;
          if (result?.summary) {
            this.logs.push({ type: 'info', message: result.summary, timestamp: new Date() });
          }
          if (result?.counts) {
            this.logs.push({
              type: 'info',
              message: `Counts: ${JSON.stringify(result.counts)}`,
              timestamp: new Date(),
            });
          }

          const stepEmittedWarnings = [...this.currentStepWarnings];
          const unrenderedWarnings: string[] = [];
          const remainingEmitted = [...stepEmittedWarnings];

          for (const warning of result?.warnings || []) {
            const matchIdx = remainingEmitted.indexOf(warning);
            if (matchIdx !== -1) {
              remainingEmitted.splice(matchIdx, 1);
            } else {
              unrenderedWarnings.push(warning);
              this.warningsCount++;
              this.logs.push({
                type: 'info',
                message: `Warning: ${warning}`,
                timestamp: new Date(),
              });
            }
          }

          const stepResultForReporter = result
            ? { ...result, warnings: unrenderedWarnings }
            : result;
          this.reporter.stepCompleted({ step, durationMs, result: stepResultForReporter });
          this.logs.push({
            type: 'info',
            message: `${step.id} completed in ${durationMs}ms.`,
            timestamp: new Date(),
          });
          completedStepsCount++;
        } catch (error) {
          const durationMs = Date.now() - stepStartedAt;
          failedStep = step;
          this.error(`${step.id} failed.`, error);
          this.reporter.stepFailed({ step, durationMs, error });
          break;
        }
      }
    } catch (error) {
      this.error('Synchronization preconditions failed.', error);
      this.reporter.preconditionsFailed({ error });
    } finally {
      if (!this.hasErrors) clearCache();
      if (advisoryLock?.acquired) await advisoryLock.release();
      if (this.context.db && typeof this.context.db.end === 'function') {
        await this.context.db.end();
      }

      const totalDurationMs = Date.now() - startedAt;
      if (this.hasErrors) {
        this.reporter.runFailed({
          completedSteps: completedStepsCount,
          failedStepId: failedStep ? failedStep.id : 'preconditions',
          remainingSteps: failedStep
            ? this.steps.length - completedStepsCount - 1
            : this.steps.length,
          warningsCount: this.warningsCount,
          durationMs: totalDurationMs,
        });
        this.logs.push({
          type: 'info',
          message: 'Sync finished with errors.',
          timestamp: new Date(),
        });
      } else {
        this.reporter.runCompleted({
          mode: this.mode,
          totalSteps: this.steps.length,
          succeededSteps: completedStepsCount,
          warningsCount: this.warningsCount,
          durationMs: totalDurationMs,
          seasonId: this.context.seasonId,
        });
        this.logs.push({
          type: 'info',
          message: 'Sync finished successfully.',
          timestamp: new Date(),
        });
      }
    }
  }
}
