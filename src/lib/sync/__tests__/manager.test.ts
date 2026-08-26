import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    connect: vi.fn(),
    end: vi.fn(async () => {}),
  },
}));

vi.mock('../../db/client', () => ({ db: mockDb }));
vi.mock('../../db/schema_init', () => ({
  ensureSchema: vi.fn(async () => {}),
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

  it('logs the declared source, writes and result counts', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: false });
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
  });

  it('uses read-only schema validation in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const schema = await import('../../db/schema_init');
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ useAdvisoryLock: false });

    await manager.run();

    expect(schema.validateSchemaReady).toHaveBeenCalledOnce();
    expect(schema.ensureSchema).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
