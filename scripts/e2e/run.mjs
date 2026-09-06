import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import path from 'node:path';
import pg from 'pg';
import { assertFixtureTarget } from './safety.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const envFiles = readdirSync(root).filter(
  (name) => /^\.env(?:\.|$)/.test(name) && !name.endsWith('.example')
);
if (envFiles.length)
  throw new Error(
    'Run fixture tests in a clean worktree without .env files. The runner provides its own synthetic environment.'
  );
const pgConfig = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
const pgBin = process.env.PG_BINDIR || pgConfig.stdout?.trim();
if (!pgBin)
  throw new Error(
    'Install local PostgreSQL and expose pg_config, or set PG_BINDIR. No existing database is used.'
  );
const temp = mkdtempSync(path.join(tmpdir(), 'biwenger-e2e-'));
const data = path.join(temp, 'pgdata');
const sockets = path.join(temp, 'sockets');
mkdirSync(sockets);
const env = Object.fromEntries(
  [
    'PATH',
    'HOME',
    'TMPDIR',
    'LANG',
    'LC_ALL',
    'CI',
    'SYSTEMROOT',
    'DISPLAY',
    'PLAYWRIGHT_BROWSERS_PATH',
  ]
    .filter((key) => process.env[key])
    .map((key) => [key, process.env[key]])
);
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
const dbPort = await freePort();
const appPort = await freePort();
const database = `biwenger_e2e_${process.pid}`;
const connectionString = `postgresql://fixture@127.0.0.1:${dbPort}/${database}`;
Object.assign(env, {
  BIWENGER_E2E_DISPOSABLE: 'true',
  E2E_DATABASE_URL: connectionString,
  DATABASE_URL: connectionString,
  AUTH_SECRET: 'biwenger-disposable-fixture-auth-secret-only',
  AUTH_URL: `http://127.0.0.1:${appPort}`,
  AUTH_TRUST_HOST: 'true',
  E2E_USERNAME: 'Fixture Manager',
  E2E_PASSWORD: 'fixture-only-password',
  PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${appPort}`,
  E2E_REQUIRED: 'true',
  SEASON_ID: '2025-26',
  SEASON_NAME: 'Fixture League 2025-26',
  NEXT_TELEMETRY_DISABLED: '1',
});
assertFixtureTarget(connectionString, env);
let pgStarted = false;
let app;
let activeChild;
let cleaned = false;
function sync(binary, args) {
  const result = spawnSync(binary, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(binary)} failed (${result.status})`);
}
function run(args, overrides = {}) {
  return new Promise((resolve, reject) => {
    activeChild = spawn(process.execPath, args, {
      cwd: root,
      env: { ...env, ...overrides },
      stdio: 'inherit',
    });
    activeChild.once('error', reject);
    activeChild.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${args[0]} failed (${code})`))
    );
  });
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  await exited;
  clearTimeout(timer);
}
async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  await stop(activeChild);
  await stop(app);
  if (pgStarted) {
    const stopped = spawnSync(
      path.join(pgBin, 'pg_ctl'),
      ['-D', data, '-m', 'immediate', '-w', 'stop'],
      { env, stdio: 'inherit' }
    );
    if (stopped.status !== 0) {
      console.error(`Could not stop fixture PostgreSQL; preserve ${temp} for manual cleanup.`);
      return;
    }
  }
  rmSync(temp, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    void cleanup().then(() => process.exit(130));
  });
try {
  sync(path.join(pgBin, 'initdb'), [
    '-D',
    data,
    '--username=fixture',
    '--auth=trust',
    '--no-locale',
    '--encoding=UTF8',
  ]);
  sync(path.join(pgBin, 'pg_ctl'), [
    '-D',
    data,
    '-l',
    path.join(temp, 'postgres.log'),
    '-o',
    `-h 127.0.0.1 -p ${dbPort} -k ${sockets}`,
    '-w',
    'start',
  ]);
  pgStarted = true;
  const admin = new pg.Client({
    connectionString: `postgresql://fixture@127.0.0.1:${dbPort}/postgres`,
  });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }
  await run(['scripts/e2e/seed.mjs']);
  await run(['node_modules/next/dist/bin/next', 'build'], { SKIP_DB: 'true' });
  cpSync(path.join(root, 'public'), path.join(root, '.next/standalone/public'), {
    recursive: true,
  });
  cpSync(path.join(root, '.next/static'), path.join(root, '.next/standalone/.next/static'), {
    recursive: true,
  });
  app = spawn(process.execPath, ['.next/standalone/server.js'], {
    cwd: root,
    env: { ...env, HOSTNAME: '127.0.0.1', PORT: String(appPort) },
    stdio: 'inherit',
  });
  let appError;
  app.once('error', (error) => {
    appError = error;
  });
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline) {
    if (appError) throw appError;
    if (app.exitCode !== null) throw new Error('Fixture app exited before readiness');
    try {
      ready = (
        await fetch(`${env.PLAYWRIGHT_BASE_URL}/login`, { signal: AbortSignal.timeout(1000) })
      ).ok;
    } catch {
      /* retry until deadline */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Fixture app did not become ready');
  await run(['node_modules/playwright/cli.js', 'test', ...process.argv.slice(2)]);
} finally {
  await cleanup();
}
