import * as dotenv from 'dotenv';
import pg from 'pg';
import { auditSchema, hasDrift, type SchemaDrift } from '../../src/lib/db/schema-audit';

dotenv.config({ path: '.env.local' });
dotenv.config();

function connectionStringFromEnv(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  return undefined;
}

function isLocalDatabaseTarget(connectionString: string | undefined): boolean {
  if (!connectionString) {
    const host = process.env.POSTGRES_HOST;
    return !host || host === 'localhost' || host === '127.0.0.1' || host === 'postgres';
  }

  try {
    const url = new URL(connectionString);
    return ['localhost', '127.0.0.1', 'postgres'].includes(url.hostname);
  } catch {
    return (
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1') ||
      connectionString.includes('@postgres:')
    );
  }
}

function printDrift(title: string, drift: SchemaDrift) {
  console.log(`\n${title}`);
  for (const [key, values] of Object.entries(drift)) {
    if (values.length === 0) {
      console.log(`  ${key}: none`);
      continue;
    }
    console.log(`  ${key}:`);
    for (const value of values) console.log(`    - ${value}`);
  }
}

async function main() {
  const metadataOnly = process.argv.includes('--metadata-only');
  const allowRemote =
    process.argv.includes('--allow-remote') || process.env.ALLOW_REMOTE_SCHEMA_AUDIT === 'true';
  const connectionString = connectionStringFromEnv();
  const shouldConnect = !metadataOnly;

  if (shouldConnect && !allowRemote && !isLocalDatabaseTarget(connectionString)) {
    console.error('Refusing to audit a remote-looking database target without explicit approval.');
    console.error(
      'Take backups first, then rerun with ALLOW_REMOTE_SCHEMA_AUDIT=true or --allow-remote.'
    );
    console.error(
      'Use `npm run db:audit:schema:metadata` to compare source schema and migrations only.'
    );
    process.exit(2);
  }

  if (metadataOnly) {
    const result = await auditSchema();
    console.log('Schema metadata audit completed without a database connection.');
    console.log(`Source tables: ${result.sourceTableCount}`);
    console.log(`Migration snapshot tables: ${result.migrationTableCount}`);
    printDrift('Source vs latest Drizzle snapshot', result.sourceVsMigration);
    process.exit(hasDrift(result.sourceVsMigration) ? 1 : 0);
  }

  const pool = connectionString
    ? new pg.Pool({
        connectionString,
        ssl:
          connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
            ? false
            : { rejectUnauthorized: false },
      })
    : new pg.Pool({
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
        database: process.env.POSTGRES_DB,
      });

  try {
    const result = await auditSchema(pool);
    console.log('Schema audit completed in read-only mode.');
    console.log(`Source tables: ${result.sourceTableCount}`);
    console.log(`Migration snapshot tables: ${result.migrationTableCount}`);
    console.log(`Database tables: ${result.databaseTableCount ?? 'not checked'}`);

    printDrift('Source vs latest Drizzle snapshot', result.sourceVsMigration);
    if (result.sourceVsDatabase) printDrift('Source vs database metadata', result.sourceVsDatabase);

    const failed =
      hasDrift(result.sourceVsMigration) ||
      (result.sourceVsDatabase ? hasDrift(result.sourceVsDatabase) : false);

    process.exit(failed ? 1 : 0);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Schema audit failed:', error);
  process.exit(1);
});
