import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const commands = [
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
];
for (const [command, args] of commands) {
  console.log(`\nChecking: ${command} ${args.join(' ')}`);
  const binary =
    process.platform === 'win32' && ['npm', 'npx'].includes(command) ? `${command}.cmd` : command;
  const result = spawnSync(binary, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SKIP_DB: 'true' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Verification passed. Run npm run test:e2e:local for browser verification.');
