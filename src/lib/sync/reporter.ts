import type { SyncMode, SyncSource, SyncStepDefinition, SyncStepResult } from './manager';

export interface ReporterWriter {
  log(line: string): void;
  error(line: string): void;
}

export const defaultReporterWriter: ReporterWriter = {
  log: (line: string) => console.log(line),
  error: (line: string) => console.error(line),
};

export const DIVIDER = '────────────────────────────────────────';

/**
 * Formats duration in milliseconds to human-friendly string:
 * - < 1000ms: e.g. "423ms"
 * - < 10s: e.g. "1.42s"
 * - < 60s: e.g. "18.7s"
 * - >= 60s: e.g. "1m 12s"
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.max(0, Math.round(durationMs))}ms`;
  }
  if (durationMs < 10000) {
    const s = durationMs / 1000;
    const fixed = s.toFixed(2);
    const trimmed = fixed.replace(/(\.[0-9]*[1-9])0+$|\.00$/, '$1');
    return `${trimmed}s`;
  }
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Humanizes camelCase and snake_case metric keys into clean display titles:
 * - "users" -> "Users"
 * - "market_values" -> "Market values"
 * - "mappedTeams" -> "Mapped teams"
 * - "pendingPlayers" -> "Pending players"
 * - "official_teams" -> "Official teams"
 */
export function humanizeMetricKey(key: string): string {
  if (!key) return '';
  let normalized = key.replace(/[-_]+/g, ' ');
  normalized = normalized.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Maps internal sync source identifiers to human-readable presentation names.
 */
export function formatSource(source: SyncSource | string): string {
  switch (source) {
    case 'biwenger':
      return 'Biwenger';
    case 'euroleague':
      return 'EuroLeague';
    case 'database':
      return 'Database';
    case 'biwenger+database':
      return 'Biwenger + Database';
    default:
      return source;
  }
}

/**
 * Formats a key-value header block with consistent column width and divider.
 */
export function formatHeaderBlock(
  title: string,
  entries: [string, string | number | undefined][],
  colWidth = 11
): string[] {
  const lines: string[] = [title, DIVIDER];
  for (const [key, value] of entries) {
    if (value !== undefined) {
      lines.push(`${key.padEnd(colWidth)}${value}`);
    }
  }
  return lines;
}

/**
 * Formats a record of metric counts into aligned tabular key-value lines.
 */
export function formatMetrics(
  counts: Record<string, number | string | boolean | undefined>,
  indent = '  '
): string[] {
  const entries = Object.entries(counts).filter(([, val]) => val !== undefined);
  if (entries.length === 0) return [];

  const formatted = entries.map(([k, v]) => ({
    label: humanizeMetricKey(k),
    value: String(v),
  }));

  const maxLabelLen = Math.max(...formatted.map((e) => e.label.length));
  const maxValLen = Math.max(...formatted.map((e) => e.value.length));
  const labelColWidth = Math.max(11, maxLabelLen + 5);

  return formatted.map(
    ({ label, value }) => `${indent}${label.padEnd(labelColWidth)}${value.padStart(maxValLen)}`
  );
}

/**
 * Normalizes intermediate step progress messages for consistent display:
 * strips leading/trailing decorative icons, indentation, newlines.
 */
export function cleanDetailMessage(message: string): string {
  return message
    .replace(/^[\r\n\s]+/, '')
    .replace(/[\r\n\s]+$/, '')
    .replace(/^(?:[·>\-*\s]|(?:(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])\ufe0f?\s*))+/, '')
    .trim();
}

export class SyncReporter {
  private readonly writer: ReporterWriter;

  constructor(options: { writer?: ReporterWriter } = {}) {
    this.writer = options.writer ?? defaultReporterWriter;
  }

  runStarted(params: { mode: SyncMode; totalSteps: number }): void {
    const lines = formatHeaderBlock('BIWENGER SYNC', [
      ['Mode', params.mode],
      ['Steps', params.totalSteps],
    ]);
    for (const line of lines) {
      this.writer.log(line);
    }
  }

  seasonResolved(params: { seasonId: string; status: string; euroleagueCode?: string }): void {
    this.writer.log(`Season     ${params.seasonId}`);
    this.writer.log(`Status     ${params.status}`);
    if (params.euroleagueCode) {
      this.writer.log(`EuroLeague ${params.euroleagueCode}`);
    }
  }

  runSkipped(params: { reason: string }): void {
    this.writer.log('');
    const lines = formatHeaderBlock('SYNC SKIPPED', [['Reason', params.reason]]);
    for (const line of lines) {
      this.writer.log(line);
    }
  }

  stepStarted(params: { index: number; total: number; step: SyncStepDefinition }): void {
    const title = `[${params.index}/${params.total}] ${params.step.title}`;
    const writes = params.step.writes.length > 0 ? params.step.writes.join(', ') : 'none';
    const lines = [
      '',
      title,
      DIVIDER,
      `ID         ${params.step.id}`,
      `Source     ${formatSource(params.step.source)}`,
      `Writes     ${writes}`,
      '',
    ];
    for (const line of lines) {
      this.writer.log(line);
    }
  }

  stepDetail(message: string): void {
    const clean = cleanDetailMessage(message);
    if (clean) {
      this.writer.log(`  · ${clean}`);
    }
  }

  stepCompleted(params: {
    step: SyncStepDefinition;
    durationMs: number;
    result?: SyncStepResult | void;
  }): void {
    const { result, durationMs } = params;

    if (result && result.counts && Object.keys(result.counts).length > 0) {
      this.writer.log('');
      this.writer.log('Result');
      for (const line of formatMetrics(result.counts)) {
        this.writer.log(line);
      }
    }

    if (result?.summary) {
      this.writer.log('');
      this.writer.log(result.summary);
    }

    if (result?.warnings && result.warnings.length > 0) {
      this.writer.log('');
      this.writer.log('Warnings');
      for (const warning of result.warnings) {
        this.writer.log(`  ! ${warning}`);
      }
    }

    this.writer.log(`✓ Completed in ${formatDuration(durationMs)}`);
  }

  stepFailed(params: { step: SyncStepDefinition; durationMs: number; error: unknown }): void {
    const errorMsg = params.error instanceof Error ? params.error.message : String(params.error);
    this.writer.log(`✗ Failed after ${formatDuration(params.durationMs)}`);
    this.writer.log(`  Reason: ${errorMsg}`);
  }

  preconditionsFailed(params: { error: unknown }): void {
    const errorMsg = params.error instanceof Error ? params.error.message : String(params.error);
    this.writer.error(`✗ Preconditions failed: ${errorMsg}`);
  }

  runCompleted(params: {
    mode: SyncMode;
    totalSteps: number;
    succeededSteps: number;
    warningsCount: number;
    durationMs: number;
    seasonId?: string;
  }): void {
    this.writer.log('');
    const entries: [string, string | number | undefined][] = [
      ['Mode', params.mode],
      ['Season', params.seasonId ?? '-'],
      ['Steps', `${params.succeededSteps} / ${params.totalSteps} succeeded`],
      ['Warnings', params.warningsCount],
      ['Duration', formatDuration(params.durationMs)],
    ];
    const lines = formatHeaderBlock('SYNC COMPLETE', entries, 12);
    for (const line of lines) {
      this.writer.log(line);
    }
  }

  runFailed(params: {
    completedSteps: number;
    failedStepId: string;
    remainingSteps: number;
    warningsCount: number;
    durationMs: number;
  }): void {
    this.writer.log('');
    const entries: [string, string | number | undefined][] = [
      ['Completed', params.completedSteps],
      ['Failed', params.failedStepId],
      ['Not run', params.remainingSteps],
      ['Warnings', params.warningsCount],
      ['Duration', formatDuration(params.durationMs)],
    ];
    const lines = formatHeaderBlock('SYNC FAILED', entries, 13);
    for (const line of lines) {
      this.writer.log(line);
    }
  }
}
