import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    connect: vi.fn(),
    end: vi.fn(async () => {}),
  },
}));

vi.mock('../../db/client', () => ({
  db: mockDb,
}));

vi.mock('../../db/schema_init', () => ({
  ensureSchema: vi.fn(async () => {}),
}));

vi.mock('../../utils/cache', () => ({
  clearCache: vi.fn(),
}));

vi.mock('../season-guard', () => ({
  assertSyncSeasonWritable: vi.fn(async () => ({ seasonId: '2026-27', status: 'active' })),
}));

describe('SyncManager hardening behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.connect.mockResolvedValue({
      query: vi.fn(async () => ({ rows: [{ locked: true }] })),
      release: vi.fn(),
    });
  });

  it('stops after a critical step fails by default', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager('unused', { useAdvisoryLock: false });
    const first = vi.fn(async () => ({ success: false, error: new Error('boom') }));
    const second = vi.fn(async () => ({ success: true }));

    manager.addStep('critical failure', first, { number: 1, critical: true });
    manager.addStep('dependent step', second, { number: 2, dependencies: [1] });

    await manager.run();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(manager.hasErrors).toBe(true);
  });

  it('can preserve legacy continue-on-error behavior when explicitly configured', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager('unused', {
      continueOnError: true,
      useAdvisoryLock: false,
    });
    const first = vi.fn(async () => ({ success: false, error: new Error('boom') }));
    const second = vi.fn(async () => ({ success: true }));

    manager.addStep('critical failure', first, { number: 1, critical: true });
    manager.addStep('next step', second, { number: 2 });

    await manager.run();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(manager.hasErrors).toBe(true);
  });

  it('continues after a non-critical step fails', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager('unused', { useAdvisoryLock: false });
    const first = vi.fn(async () => ({ success: false, error: new Error('optional failed') }));
    const second = vi.fn(async () => ({ success: true }));

    manager.addStep('optional failure', first, { number: 10, critical: false });
    manager.addStep('critical next step', second, { number: 11, critical: true });

    await manager.run();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(manager.hasErrors).toBe(true);
  });

  it('skips all work when the advisory lock is unavailable', async () => {
    const lockClient = {
      query: vi.fn(async () => ({ rows: [{ locked: false }] })),
      release: vi.fn(),
    };
    mockDb.connect.mockResolvedValue(lockClient);

    const { SyncManager } = await import('../manager');
    const manager = new SyncManager('unused', { useAdvisoryLock: true });
    const step = vi.fn(async () => ({ success: true }));
    manager.addStep('should not run', step);

    await manager.run();

    expect(step).not.toHaveBeenCalled();
    expect(lockClient.release).toHaveBeenCalledTimes(1);
    expect(manager.lockUnavailable).toBe(true);
    expect(manager.hasErrors).toBe(false);
  });

  it('keeps --step style single-step registration compatible', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager('unused', { useAdvisoryLock: false });
    const step = vi.fn(async () => ({ success: true }));

    manager.addStep('selected step', step, { number: 7 });
    await manager.run();

    expect(step).toHaveBeenCalledTimes(1);
    expect(manager.steps[0].metadata.number).toBe(7);
  });
});
