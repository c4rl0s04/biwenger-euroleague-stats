import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import path from 'node:path';
import pg, { type Pool } from 'pg';
import { assertFixtureTarget } from '../e2e/safety.mjs';

export interface DisposablePostgres {
  connectionString: string;
  pool: Pool;
  databaseName: string;
  port: number;
  cleanup: () => Promise<void>;
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to obtain a free port.')));
      }
    });
  });
}

function findPostgresBinDir(): string | null {
  if (process.env.PG_BINDIR && existsSync(path.join(process.env.PG_BINDIR, 'initdb'))) {
    return process.env.PG_BINDIR;
  }
  try {
    const pgConfig = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
    const dir = pgConfig.stdout?.trim();
    if (dir && existsSync(path.join(dir, 'initdb'))) {
      return dir;
    }
  } catch {
    // Ignore and proceed to Docker fallback
  }
  return null;
}

function isDockerAvailable(): boolean {
  try {
    const result = spawnSync('docker', ['--version'], { encoding: 'utf8' });
    return result.status === 0;
  } catch {
    return false;
  }
}

async function waitForPostgresReady(connectionString: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const client = new pg.Client({ connectionString });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch {
      await client.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Timed out waiting for PostgreSQL to become ready at ${connectionString}`);
}

/**
 * Starts an isolated, disposable PostgreSQL cluster on 127.0.0.1 and provisions an empty test database.
 * Auto-detects local PostgreSQL binaries (`pg_config` / `PG_BINDIR`), falling back to Docker.
 */
export async function startDisposablePostgres(): Promise<DisposablePostgres> {
  const pgBin = findPostgresBinDir();
  const dbPort = await getFreePort();
  const databaseName = `biwenger_e2e_fresh_${process.pid}_${Date.now()}`;

  let stopped = false;
  let cleanupFn: () => Promise<void> = async () => {};

  if (pgBin) {
    const temp = mkdtempSync(path.join(tmpdir(), 'biwenger-fresh-db-'));
    const data = path.join(temp, 'pgdata');
    const sockets = path.join(temp, 'sockets');
    mkdirSync(sockets, { recursive: true });

    // Initialize clean cluster
    const initResult = spawnSync(
      path.join(pgBin, 'initdb'),
      ['-D', data, '--username=fixture', '--auth=trust', '--no-locale', '--encoding=UTF8'],
      { encoding: 'utf8', stdio: 'pipe' }
    );
    if (initResult.status !== 0) {
      rmSync(temp, { recursive: true, force: true });
      throw new Error(`initdb failed: ${initResult.stderr || initResult.stdout}`);
    }

    // Start PostgreSQL
    const startResult = spawnSync(
      path.join(pgBin, 'pg_ctl'),
      [
        '-D',
        data,
        '-l',
        path.join(temp, 'postgres.log'),
        '-o',
        `-h 127.0.0.1 -p ${dbPort} -k ${sockets}`,
        '-w',
        'start',
      ],
      { encoding: 'utf8', stdio: 'pipe' }
    );
    if (startResult.status !== 0) {
      rmSync(temp, { recursive: true, force: true });
      throw new Error(`pg_ctl start failed: ${startResult.stderr || startResult.stdout}`);
    }

    cleanupFn = async () => {
      if (stopped) return;
      stopped = true;
      spawnSync(path.join(pgBin, 'pg_ctl'), ['-D', data, '-m', 'immediate', '-w', 'stop'], {
        stdio: 'ignore',
      });
      rmSync(temp, { recursive: true, force: true });
    };
  } else if (isDockerAvailable()) {
    const containerName = `biwenger-e2e-pg-${process.pid}-${Date.now()}`;
    const runResult = spawnSync(
      'docker',
      [
        'run',
        '-d',
        '--rm',
        '--name',
        containerName,
        '-e',
        'POSTGRES_USER=fixture',
        '-e',
        'POSTGRES_PASSWORD=disposable',
        '-e',
        'POSTGRES_DB=postgres',
        '-p',
        `127.0.0.1:${dbPort}:5432`,
        'postgres:17-alpine',
      ],
      { encoding: 'utf8', stdio: 'pipe' }
    );
    if (runResult.status !== 0) {
      throw new Error(`docker run failed: ${runResult.stderr || runResult.stdout}`);
    }

    cleanupFn = async () => {
      if (stopped) return;
      stopped = true;
      spawnSync('docker', ['stop', containerName], { stdio: 'ignore' });
    };
  } else {
    throw new Error(
      'No local PostgreSQL binaries (pg_config/PG_BINDIR) or Docker found to start a disposable database.'
    );
  }

  // Admin connection to default postgres database
  const adminConnectionString = pgBin
    ? `postgresql://fixture@127.0.0.1:${dbPort}/postgres`
    : `postgresql://fixture:disposable@127.0.0.1:${dbPort}/postgres`;

  try {
    await waitForPostgresReady(adminConnectionString);

    const admin = new pg.Client({ connectionString: adminConnectionString });
    await admin.connect();
    try {
      // Set up roles expected by committed migrations (0009, 0011)
      await admin.query(
        "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;"
      );
      // Create empty test database
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    } finally {
      await admin.end();
    }
  } catch (error) {
    await cleanupFn();
    throw error;
  }

  const connectionString = pgBin
    ? `postgresql://fixture@127.0.0.1:${dbPort}/${databaseName}`
    : `postgresql://fixture:disposable@127.0.0.1:${dbPort}/${databaseName}`;

  // Strict repository safety check: reject any non-loopback, non-disposable target
  assertFixtureTarget(connectionString, { BIWENGER_E2E_DISPOSABLE: 'true' });

  const pool = new pg.Pool({ connectionString, max: 10 });

  const fullCleanup = async () => {
    try {
      await pool.end().catch(() => {});
    } finally {
      await cleanupFn();
    }
  };

  // Ensure clean teardown on exit signals
  const onSignal = () => {
    void fullCleanup().then(() => process.exit(130));
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  return {
    connectionString,
    pool,
    databaseName,
    port: dbPort,
    cleanup: async () => {
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
      await fullCleanup();
    },
  };
}
