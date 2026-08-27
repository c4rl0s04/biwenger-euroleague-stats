import type { PoolConfig } from 'pg';

type DatabaseEnvironment = Record<string, string | undefined>;

function isLocalHost(host: string | undefined): boolean {
  if (!host) return true;
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function connectionHost(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return undefined;
  }
}

export function buildPoolConfig(env: DatabaseEnvironment): PoolConfig {
  const connectionString = env.DATABASE_URL;
  if (connectionString) {
    const host = connectionHost(connectionString);
    return {
      connectionString,
      ssl: host && !isLocalHost(host) ? { rejectUnauthorized: false } : false,
    };
  }

  const host = env.POSTGRES_HOST;
  return {
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    host,
    port: env.POSTGRES_PORT ? parseInt(env.POSTGRES_PORT, 10) : 5432,
    database: env.POSTGRES_DB,
    ssl: !isLocalHost(host) ? { rejectUnauthorized: false } : false,
  };
}
