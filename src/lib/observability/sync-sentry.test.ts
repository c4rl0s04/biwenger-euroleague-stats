import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';

const exec = promisify(execFile);
const root = process.cwd();

it('delivers standalone sync and preflight errors before exiting nonzero', async () => {
  const envelopes: string[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    envelopes.push(
      (request.headers['content-encoding'] === 'gzip' ? gunzipSync(body) : body).toString()
    );
    response.end('{}');
  });
  const cwd = await mkdtemp(join(tmpdir(), 'sync-sentry-'));
  try {
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test transport address');
    const canary = 'test-only-provider-secret';
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      SENTRY_DSN: `http://testkey@127.0.0.1:${address.port}/1`,
      BIWENGER_TOKEN: canary,
    };
    const launch = (...args: string[]) =>
      exec(
        process.execPath,
        ['--conditions=react-server', '--import', import.meta.resolve('tsx'), ...args],
        { cwd, env, timeout: 7000 }
      );

    await expect(
      launch(resolve(root, 'src/lib/sync/index.ts'), `--unknown=${canary}`)
    ).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('[REDACTED]') });
    await expect(launch(resolve(root, 'scripts/sync/preflight.ts'))).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('BIWENGER_USER_ID is required'),
    });

    await expect(
      launch(
        '--eval',
        `const { runSyncCli, captureSyncError } = require(${JSON.stringify(
          resolve(root, 'src/lib/observability/sync-sentry.ts')
        )});
        runSyncCli(async () => {
          captureSyncError(new Error('Step failed'), { stepId: 'euroleague-games' });
          return 1;
        }, 'fatal-unhandled', 'Unexpected CLI error:').then((code) => process.exit(code));`
      )
    ).rejects.toMatchObject({ code: 1 });

    expect(envelopes).toHaveLength(3);
    expect(envelopes[0]).toContain('"syncStep":"fatal-unhandled"');
    expect(envelopes[0]).toContain('[REDACTED]');
    expect(envelopes[0]).not.toContain(canary);
    expect(envelopes[1]).toContain('"syncStep":"preflight"');
    expect(envelopes[2]).toContain('"syncStep":"euroleague-games"');
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    await rm(cwd, { recursive: true, force: true });
  }
}, 15000);
