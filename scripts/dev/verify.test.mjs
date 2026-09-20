import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const spawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawnSync: spawn }));

beforeEach(() => {
  vi.resetModules();
  spawn.mockReset().mockReturnValue({ status: 0 });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([undefined, 'false', 'true'])(
  'keeps all verifier children database-disabled with parent SKIP_DB=%s',
  async (parentSkip) => {
    vi.stubEnv('SKIP_DB', parentSkip);
    await import('./verify.mjs');
    // Inspect only safe fields: do not snapshot or print the inherited environment.
    const commands = spawn.mock.calls.map(([command, args, options]) => ({
      command: command.replace(/\.cmd$/, ''),
      args,
      skipDb: options.env.SKIP_DB,
    }));
    expect(commands.map(({ command, args }) => [command, args])).toEqual([
      ['npm', ['run', 'skills:check']],
      ['npm', ['run', 'architecture:check']],
      ['npm', ['run', 'docs:check']],
      ['npm', ['run', 'typecheck']],
      ['npm', ['run', 'test:run', '--', '--maxWorkers=2']],
      ['npm', ['run', 'lint']],
      ['npm', ['run', 'build']],
      ['npm', ['run', 'db:audit:schema:metadata']],
      ['npx', ['--no-install', 'drizzle-kit', 'check']],
      ['git', ['diff', '--check']],
    ]);
    expect(commands.every(({ skipDb }) => skipDb === 'true')).toBe(true);
    expect(process.env.SKIP_DB).toBe(parentSkip);
  }
);

it('stops at a failing test command without running later checks', async () => {
  spawn.mockImplementation((_command, args) => ({ status: args.includes('test:run') ? 2 : 0 }));
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('fixture exit');
  });
  await expect(import('./verify.mjs')).rejects.toThrow('fixture exit');
  expect(exit).toHaveBeenCalledWith(2);
  expect(spawn).toHaveBeenCalledTimes(5);
});

it('propagates a spawn failure instead of reporting verification success', async () => {
  spawn.mockReturnValue({ error: new Error('fixture spawn failure'), status: null });
  await expect(import('./verify.mjs')).rejects.toThrow('fixture spawn failure');
  expect(spawn).toHaveBeenCalledTimes(1);
});
