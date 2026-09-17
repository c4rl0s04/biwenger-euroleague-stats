import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    connect: vi.fn(),
    end: vi.fn(async () => {}),
  },
}));

vi.mock('../../db/client', () => ({ pool: mockDb, db: mockDb }));
vi.mock('../../db/schema-validation', () => ({
  validateSchemaReady: vi.fn(async () => {}),
}));
vi.mock('../../utils/cache', () => ({ clearCache: vi.fn() }));
vi.mock('../season-guard', () => ({
  assertSyncSeasonWritable: vi.fn(async () => ({ seasonId: '2026-27', status: 'active' })),
}));

const definition = (id: string, run: any) => ({
  id,
  title: id,
  source: 'database' as const,
  writes: [],
  modes: ['routine'] as const,
  dependencies: [],
  run,
});

describe('SyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.connect.mockResolvedValue({
      query: vi.fn(async () => ({ rows: [{ locked: true }] })),
      release: vi.fn(),
    });
  });

  it('fails fast after the first step exception', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: false });
    const first = vi.fn(async () => {
      throw new Error('boom');
    });
    const second = vi.fn(async () => ({ summary: 'done' }));
    manager.addStep(definition('first', first));
    manager.addStep(definition('second', second));

    await manager.run();

    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    expect(manager.hasErrors).toBe(true);
  });

  it('skips all work when the shared advisory lock is unavailable', async () => {
    const lockClient = {
      query: vi.fn(async () => ({ rows: [{ locked: false }] })),
      release: vi.fn(),
    };
    mockDb.connect.mockResolvedValue(lockClient);
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: true });
    const run = vi.fn(async () => ({ summary: 'done' }));
    manager.addStep(definition('never', run));

    await manager.run();

    expect(run).not.toHaveBeenCalled();
    expect(manager.lockUnavailable).toBe(true);
    expect(manager.hasErrors).toBe(false);
    expect(lockClient.release).toHaveBeenCalledOnce();
  });

  it('logs the declared source, writes and result counts to diagnostic logs and reporter', async () => {
    const terminalLines: string[] = [];
    const writer = {
      log: (line: string) => terminalLines.push(line),
      error: (line: string) => terminalLines.push(line),
    };
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: false, writer });
    manager.addStep({
      ...definition(
        'visible-step',
        vi.fn(async () => ({ summary: 'stored', counts: { rows: 2 } }))
      ),
      source: 'euroleague',
      writes: ['official_games'],
    });

    await manager.run();

    const output = manager.logs.map((entry) => entry.message).join('\n');
    expect(output).toContain('Source: euroleague; writes: official_games');
    expect(output).toContain('Counts: {"rows":2}');

    const terminalOutput = terminalLines.join('\n');
    expect(terminalOutput).toContain('Source     EuroLeague');
    expect(terminalOutput).toContain('Writes     official_games');
    expect(terminalOutput).toContain('  Rows       2');
    expect(terminalOutput).toContain('stored');
    expect(terminalOutput).toContain('SYNC COMPLETE');
  });

  it('uses read-only schema validation in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const schema = await import('../../db/schema-validation');
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: false });

    await manager.run();

    expect(schema.validateSchemaReady).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  describe('warnings reporting', () => {
    it('renders manager.warn() as a warning, stores in logs, increments count, and remains non-fatal', async () => {
      const terminalLines: string[] = [];
      const writer = {
        log: (line: string) => terminalLines.push(line),
        error: (line: string) => terminalLines.push(line),
      };
      const { SyncManager } = await import('../manager');
      const manager = new SyncManager({ useAdvisoryLock: false, writer });

      const step1 = vi.fn(async (m: any) => {
        m.warn('Inserted 2 transfers with missing players');
        return { summary: 'step 1 done' };
      });
      const step2 = vi.fn(async () => ({ summary: 'step 2 done' }));

      manager.addStep(definition('step-1', step1));
      manager.addStep(definition('step-2', step2));

      await manager.run();

      // Non-fatal: both steps ran
      expect(step1).toHaveBeenCalledOnce();
      expect(step2).toHaveBeenCalledOnce();
      expect(manager.hasErrors).toBe(false);

      // Preserved in logs with type: warning
      const warnLogs = manager.logs.filter((l) => l.type === 'warning');
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].message).toBe('Inserted 2 transfers with missing players');

      // Rendered in terminal output
      const terminalOutput = terminalLines.join('\n');
      expect(terminalOutput).toContain('  ! Inserted 2 transfers with missing players');

      // Final summary reflects warning count
      expect(manager.warningsCount).toBe(1);
      expect(terminalOutput).toContain('Warnings    1');
    });

    it('counts existing result.warnings and renders them in step completion', async () => {
      const terminalLines: string[] = [];
      const writer = {
        log: (line: string) => terminalLines.push(line),
        error: (line: string) => terminalLines.push(line),
      };
      const { SyncManager } = await import('../manager');
      const manager = new SyncManager({ useAdvisoryLock: false, writer });

      manager.addStep(
        definition(
          'catalog-step',
          vi.fn(async () => ({
            summary: 'catalog done',
            warnings: ['Optional details unavailable for player John Doe'],
          }))
        )
      );

      await manager.run();

      expect(manager.hasErrors).toBe(false);
      expect(manager.warningsCount).toBe(1);

      const terminalOutput = terminalLines.join('\n');
      expect(terminalOutput).toContain('Warnings');
      expect(terminalOutput).toContain('  ! Optional details unavailable for player John Doe');
      expect(terminalOutput).toContain('Warnings    1');
    });

    it('does not double-count when a warning is both emitted via manager.warn() and returned in result.warnings', async () => {
      const terminalLines: string[] = [];
      const writer = {
        log: (line: string) => terminalLines.push(line),
        error: (line: string) => terminalLines.push(line),
      };
      const { SyncManager } = await import('../manager');
      const manager = new SyncManager({ useAdvisoryLock: false, writer });

      manager.addStep(
        definition(
          'dual-warn-step',
          vi.fn(async (m: any) => {
            m.warn('Player review required: John Doe (JDOE)');
            return {
              summary: 'done',
              warnings: ['Player review required: John Doe (JDOE)', 'Additional separate warning'],
            };
          })
        )
      );

      await manager.run();

      expect(manager.hasErrors).toBe(false);
      // Exactly 2 warnings: the emitted one + the additional separate one (not 3)
      expect(manager.warningsCount).toBe(2);

      const terminalOutput = terminalLines.join('\n');
      expect(terminalOutput).toContain('Warnings    2');

      // The emitted warning should appear once as immediate warning `  ! Player review required...`
      // and not duplicated in the Warnings section
      const countEmitted = (terminalOutput.match(/Player review required: John Doe/g) || []).length;
      expect(countEmitted).toBe(1);
    });
  });
});
