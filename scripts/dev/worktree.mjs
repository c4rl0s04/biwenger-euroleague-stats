import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const expected = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
if (process.versions.node !== expected) {
  console.error(
    `Use Node ${expected} (see .nvmrc); current Node is ${process.versions.node}. Run nvm install && nvm use, or use an equivalent version manager.`
  );
  process.exit(1);
}
const action = process.argv[2];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (action === 'setup') {
  const result = spawnSync(npm, ['ci', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
} else if (action === 'dev' || action === 'port') {
  // Stable per checkout. Probe rather than attaching to another worktree's server.
  const base = 3100 + (createHash('sha256').update(root).digest().readUInt16BE() % 1000);
  const available = (port) =>
    new Promise((resolve) => {
      const server = createServer();
      server.once('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
    });
  let port = base;
  while (port < base + 100 && !(await available(port))) port++;
  if (port === base + 100) throw new Error('No free worktree port available');
  if (action === 'port') console.log(port);
  else {
    console.log(`Worktree dev server: http://127.0.0.1:${port}`);
    const result = spawnSync(
      process.execPath,
      [
        'node_modules/next/dist/bin/next',
        'dev',
        '--turbopack',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      { cwd: root, stdio: 'inherit' }
    );
    if (result.error) throw result.error;
    process.exit(result.status ?? 1);
  }
} else {
  console.error('Usage: node scripts/dev/worktree.mjs setup|dev|port');
  process.exit(1);
}
