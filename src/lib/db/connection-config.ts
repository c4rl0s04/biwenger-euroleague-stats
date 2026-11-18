import type { PoolConfig } from 'pg';
import { parseIntoClientConfig } from 'pg-connection-string';
import { supabaseRootCA } from './supabase-ca';

export type DatabaseEnvironment = Record<string, string | undefined>;

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === 'postgres' ||
    host.startsWith('/')
  );
}

function resolveConnection(env: DatabaseEnvironment): PoolConfig & { host: string } {
  const connectionString = env.DATABASE_URL || env.POSTGRES_URL;
  if (connectionString) {
    if (
      !/^(postgres(?:ql)?|socket):\/\//i.test(connectionString) &&
      !connectionString.startsWith('/')
    ) {
      throw new Error('Invalid PostgreSQL connection string.');
    }

    const config = parseIntoClientConfig(connectionString);
    delete config.connectionString;
    return { ...config, host: config.host || env.PGHOST || 'localhost' };
  }

  return {
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    host: env.POSTGRES_HOST || env.PGHOST || 'localhost',
    port: env.POSTGRES_PORT ? parseInt(env.POSTGRES_PORT, 10) : 5432,
    database: env.POSTGRES_DB,
  };
}

export function isLocalDatabaseTarget(env: DatabaseEnvironment = process.env): boolean {
  try {
    return isLocalHost(resolveConnection(env).host);
  } catch {
    return false;
  }
}

export function buildPoolConfig(env: DatabaseEnvironment): PoolConfig {
  const config = resolveConnection(env);
  if (isLocalHost(config.host)) return { ...config, ssl: config.ssl ?? false };

  const { ca, cert, key } = typeof config.ssl === 'object' ? config.ssl : {};
  const supabaseHost = /(?:\.pooler\.supabase\.com|^db\.[a-z0-9]+\.supabase\.co)\.?$/i.test(
    config.host
  );
  return {
    ...config,
    // Pass parsed options so TLS settings in a DSN cannot override remote verification.
    ssl: {
      ca: ca ?? (supabaseHost ? supabaseRootCA : undefined),
      cert,
      key,
      rejectUnauthorized: true,
    },
  };
}
