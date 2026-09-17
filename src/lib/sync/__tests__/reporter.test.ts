import { describe, expect, it } from 'vitest';
import type { SyncStepDefinition } from '../manager';
import {
  cleanDetailMessage,
  formatDuration,
  formatHeaderBlock,
  formatMetrics,
  formatSource,
  humanizeMetricKey,
  ReporterWriter,
  SyncReporter,
} from '../reporter';

function createMockWriter(): { writer: ReporterWriter; logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    writer: {
      log: (line: string) => logs.push(line),
      error: (line: string) => errors.push(line),
    },
    logs,
    errors,
  };
}

const dummyStep: SyncStepDefinition = {
  id: 'biwenger-users',
  title: 'Fantasy league users',
  source: 'biwenger',
  writes: ['users', 'user_seasons'],
  modes: ['bootstrap', 'routine'],
  dependencies: [],
  run: async () => {},
};

describe('SyncReporter Pure Helpers', () => {
  describe('formatDuration', () => {
    it('formats millisecond durations (< 1000ms)', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(423)).toBe('423ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('formats seconds under 10 seconds', () => {
      expect(formatDuration(1423)).toBe('1.42s');
      expect(formatDuration(7800)).toBe('7.8s');
      expect(formatDuration(5000)).toBe('5s');
    });

    it('formats seconds with 1 decimal between 10s and 60s', () => {
      expect(formatDuration(18742)).toBe('18.7s');
      expect(formatDuration(59900)).toBe('59.9s');
    });

    it('formats minutes and seconds above 60s', () => {
      expect(formatDuration(72400)).toBe('1m 12s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });
  });

  describe('humanizeMetricKey', () => {
    it('humanizes simple keys', () => {
      expect(humanizeMetricKey('users')).toBe('Users');
      expect(humanizeMetricKey('rounds')).toBe('Rounds');
      expect(humanizeMetricKey('matches')).toBe('Matches');
    });

    it('humanizes snake_case keys', () => {
      expect(humanizeMetricKey('market_values')).toBe('Market values');
      expect(humanizeMetricKey('official_teams')).toBe('Official teams');
      expect(humanizeMetricKey('player_round_stats')).toBe('Player round stats');
    });

    it('humanizes camelCase keys', () => {
      expect(humanizeMetricKey('mappedTeams')).toBe('Mapped teams');
      expect(humanizeMetricKey('pendingPlayers')).toBe('Pending players');
      expect(humanizeMetricKey('playersOwned')).toBe('Players owned');
      expect(humanizeMetricKey('newPlayers')).toBe('New players');
    });
  });

  describe('formatSource', () => {
    it('converts source identifiers to human-readable names', () => {
      expect(formatSource('biwenger')).toBe('Biwenger');
      expect(formatSource('euroleague')).toBe('EuroLeague');
      expect(formatSource('database')).toBe('Database');
      expect(formatSource('biwenger+database')).toBe('Biwenger + Database');
      expect(formatSource('unknown' as any)).toBe('unknown');
    });
  });

  describe('formatMetrics', () => {
    it('formats aligned metrics table with right-aligned numbers', () => {
      const counts = {
        candidates: 18,
        updated: 12,
        unchanged: 5,
        unavailable: 1,
      };
      const lines = formatMetrics(counts);
      expect(lines).toEqual([
        '  Candidates      18',
        '  Updated         12',
        '  Unchanged        5',
        '  Unavailable      1',
      ]);
    });

    it('handles single metric', () => {
      const lines = formatMetrics({ users: 7 });
      expect(lines).toEqual(['  Users      7']);
    });
  });

  describe('cleanDetailMessage', () => {
    it('strips leading newlines, spaces, bullets, and emojis', () => {
      expect(cleanDetailMessage('\n📥 Fetching Standings...')).toBe('Fetching Standings...');
      expect(cleanDetailMessage('   > Discovering tournaments...')).toBe(
        'Discovering tournaments...'
      );
      expect(cleanDetailMessage('   ✅ Synced Standings')).toBe('Synced Standings');
      expect(cleanDetailMessage('  · Fetching standings')).toBe('Fetching standings');
      expect(cleanDetailMessage('Fetching standings')).toBe('Fetching standings');
    });
  });
});

describe('SyncReporter Output Scenarios', () => {
  it('renders run header before and after season resolution', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.runStarted({ mode: 'bootstrap', totalSteps: 13 });
    expect(logs).toContain('BIWENGER SYNC');
    expect(logs).toContain('────────────────────────────────────────');
    expect(logs).toContain('Mode       bootstrap');
    expect(logs).toContain('Steps      13');

    reporter.seasonResolved({
      seasonId: '2026-27',
      status: 'active',
      euroleagueCode: 'E2026',
    });
    expect(logs).toContain('Season     2026-27');
    expect(logs).toContain('Status     active');
    expect(logs).toContain('EuroLeague E2026');
  });

  it('renders step metadata properly with mapped source and writes', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.stepStarted({ index: 4, total: 13, step: dummyStep });

    expect(logs).toContain('[4/13] Fantasy league users');
    expect(logs).toContain('ID         biwenger-users');
    expect(logs).toContain('Source     Biwenger');
    expect(logs).toContain('Writes     users, user_seasons');
  });

  it('renders step with "none" when writes are empty', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.stepStarted({
      index: 1,
      total: 1,
      step: { ...dummyStep, writes: [] },
    });

    expect(logs).toContain('Writes     none');
  });

  it('renders intermediate step detail messages with bullets', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.stepDetail('Fetching standings');
    expect(logs).toContain('  · Fetching standings');
  });

  it('renders step completion with counts, summary, warnings, and duration', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.stepCompleted({
      step: dummyStep,
      durationMs: 423,
      result: {
        summary: 'Biwenger league users synchronized.',
        counts: { users: 7 },
        warnings: ['1 user had no team name'],
      },
    });

    const output = logs.join('\n');
    expect(output).toContain('Result');
    expect(output).toContain('  Users      7');
    expect(output).toContain('Biwenger league users synchronized.');
    expect(output).toContain('Warnings');
    expect(output).toContain('  ! 1 user had no team name');
    expect(output).toContain('✓ Completed in 423ms');
  });

  it('renders step failure with reason', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.stepFailed({
      step: dummyStep,
      durationMs: 1230,
      error: new Error('Database connection failed'),
    });

    expect(logs).toContain('✗ Failed after 1.23s');
    expect(logs).toContain('  Reason: Database connection failed');
  });

  it('renders skipped run when advisory lock is unavailable', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.runSkipped({ reason: 'Another synchronization is already running' });

    expect(logs).toContain('SYNC SKIPPED');
    expect(logs).toContain('Reason     Another synchronization is already running');
  });

  it('renders successful run summary', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.runCompleted({
      mode: 'bootstrap',
      seasonId: '2026-27',
      totalSteps: 13,
      succeededSteps: 13,
      warningsCount: 2,
      durationMs: 18742,
    });

    expect(logs).toContain('SYNC COMPLETE');
    expect(logs).toContain('Mode        bootstrap');
    expect(logs).toContain('Season      2026-27');
    expect(logs).toContain('Steps       13 / 13 succeeded');
    expect(logs).toContain('Warnings    2');
    expect(logs).toContain('Duration    18.7s');
  });

  it('renders failed run summary with completed, failed, and not run counts', () => {
    const { writer, logs } = createMockWriter();
    const reporter = new SyncReporter({ writer });

    reporter.runFailed({
      completedSteps: 4,
      failedStepId: 'euroleague-games',
      remainingSteps: 8,
      warningsCount: 1,
      durationMs: 7800,
    });

    expect(logs).toContain('SYNC FAILED');
    expect(logs).toContain('Completed    4');
    expect(logs).toContain('Failed       euroleague-games');
    expect(logs).toContain('Not run      8');
    expect(logs).toContain('Warnings     1');
    expect(logs).toContain('Duration     7.8s');
  });
});
