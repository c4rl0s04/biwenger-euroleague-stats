import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

let closeDatabase: (() => Promise<void>) | undefined;

function isRemoteDatabaseTarget(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const host = process.env.POSTGRES_HOST;
  if (url) return !url.includes('localhost') && !url.includes('127.0.0.1');
  return Boolean(host && host !== 'localhost' && host !== '127.0.0.1');
}

function parseBatchSize(args: string[]): number {
  const value = args.find((arg) => arg.startsWith('--batch-size='))?.split('=')[1];
  if (!value) return 100;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1_000) {
    throw new Error('--batch-size must be an integer between 1 and 1000.');
  }
  return parsed;
}

async function main() {
  const args = process.argv.slice(2);
  const operation = args[0];
  if (operation !== 'migrate' && operation !== 'rotate' && operation !== 'status') {
    throw new Error('Usage: biwenger-credential-maintenance.ts <status|migrate|rotate> [--apply]');
  }

  const apply = args.includes('--apply');
  const allowRemote =
    args.includes('--allow-remote') || process.env.ALLOW_REMOTE_CREDENTIAL_MAINTENANCE === 'true';

  if (apply && isRemoteDatabaseTarget() && !allowRemote) {
    console.error('Refusing to modify a remote-looking database without explicit approval.');
    console.error('Take a fresh backup, then set ALLOW_REMOTE_CREDENTIAL_MAINTENANCE=true.');
    process.exitCode = 2;
    return;
  }

  const [{ getEnvironmentCredentialKeyring }, repositoryModule, maintenanceModule] =
    await Promise.all([
      import('../../src/lib/credentials/keyring'),
      import('../../src/lib/credentials/repository'),
      import('../../src/lib/credentials/maintenance'),
    ]);
  const { pgClient } = await import('../../src/lib/db');
  closeDatabase = () => pgClient.end();

  const statusBefore = await repositoryModule.getCredentialStorageStatus();
  console.log('Credential storage status:', statusBefore);
  if (operation === 'status') return;

  const keyring = getEnvironmentCredentialKeyring();
  const options = {
    repository: repositoryModule.databaseCredentialMaintenanceRepository,
    keyring,
    dryRun: !apply,
    batchSize: parseBatchSize(args),
  };
  const result =
    operation === 'migrate'
      ? await maintenanceModule.migrateLegacyCredentials(options)
      : await maintenanceModule.rotateCredentials(options);

  console.log(`Credential ${operation} ${apply ? 'apply' : 'dry-run'} result:`, result);
  if (!apply) console.log('No credential records were changed. Add --apply to write changes.');
  if (apply) {
    console.log(
      'Credential storage status after apply:',
      await repositoryModule.getCredentialStorageStatus()
    );
  }
  if (result.failed > 0 || ('conflicted' in result && result.conflicted > 0)) process.exitCode = 1;
}

main()
  .catch((error) => {
    const category =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : 'unexpected_error';
    console.error('Credential maintenance failed safely.', { category });
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });
