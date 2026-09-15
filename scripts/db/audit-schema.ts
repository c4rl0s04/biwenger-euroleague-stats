import * as dotenv from 'dotenv';
import { auditSchema, hasDrift, type SchemaDrift } from '../../src/lib/db/schema-audit';
import { createCliPool, isLocalDatabaseTarget } from '../../src/lib/db/cli';

dotenv.config({ path: '.env.local' });
dotenv.config();

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
  const shouldConnect = !metadataOnly;

  if (shouldConnect && !allowRemote && !isLocalDatabaseTarget()) {
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

  const pool = createCliPool();

  try {
    const result = await auditSchema(pool);
    console.log('Schema audit completed in read-only mode.');
    console.log(`Source tables: ${result.sourceTableCount}`);
    console.log(`Migration snapshot tables: ${result.migrationTableCount}`);
    console.log(`Database tables: ${result.databaseTableCount ?? 'unknown'}`);
    printDrift('Source vs latest Drizzle snapshot', result.sourceVsMigration);
    if (result.sourceVsDatabase) {
      printDrift('Source vs live database', result.sourceVsDatabase);
    }
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
