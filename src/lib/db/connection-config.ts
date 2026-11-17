import type { PoolConfig } from 'pg';

export type DatabaseEnvironment = Record<string, string | undefined>;

export function isLocalHost(host: string | undefined): boolean {
  if (!host) return true;
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === 'postgres'
  );
}

export function connectionHost(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return undefined;
  }
}

export function databaseUrl(env: DatabaseEnvironment): string {
  const value = env.DATABASE_URL?.trim();
  if (!value) throw new Error('DATABASE_URL is required.');
  try {
    if (/[\r\n]/.test(value)) throw new Error();
    const url = new URL(value);
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    decodeURIComponent(url.pathname);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection URL with a host and database.'
    );
  }
  return value;
}

export function isLocalDatabaseTarget(env: DatabaseEnvironment = process.env): boolean {
  return isLocalHost(connectionHost(databaseUrl(env)));
}

export function buildPoolConfig(env: DatabaseEnvironment): PoolConfig {
  const connectionString = databaseUrl(env);
  const host = connectionHost(connectionString);
  return {
    connectionString,
    ssl: host && !isLocalHost(host) ? { rejectUnauthorized: false } : false,
  };
}
