import 'server-only';

import { CredentialError, credentialErrorCode, type CredentialErrorCode } from './errors';
import { decryptCredential, encryptCredential } from './crypto';
import type { CredentialEnvelope, CredentialKeyring, StoredCredential } from './types';

export interface CredentialMaintenanceRepository {
  listForRotation(
    activeKeyId: string,
    afterUserId: string | undefined,
    limit: number
  ): Promise<StoredCredential[]>;
  storeRotated(current: StoredCredential, replacement: CredentialEnvelope): Promise<boolean>;
}

type MaintenanceFailureCategory = CredentialErrorCode | 'unexpected_error';

export interface RotationResult {
  scanned: number;
  rotated: number;
  wouldRotate: number;
  conflicted: number;
  failed: number;
  failures: Partial<Record<MaintenanceFailureCategory, number>>;
}

interface MaintenanceOptions {
  repository: CredentialMaintenanceRepository;
  keyring: CredentialKeyring;
  dryRun: boolean;
  batchSize?: number;
}

function assertBatchSize(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 1_000) {
    throw new Error('Batch size must be an integer between 1 and 1000.');
  }
}

function recordFailure(
  failures: Partial<Record<MaintenanceFailureCategory, number>>,
  error: unknown
): void {
  const category = credentialErrorCode(error);
  failures[category] = (failures[category] ?? 0) + 1;
}

function verifyMatches(
  envelope: CredentialEnvelope,
  userId: string,
  expected: string,
  keyring: CredentialKeyring
): void {
  if (decryptCredential(envelope, userId, keyring) !== expected) {
    throw new CredentialError('credential_integrity_failure');
  }
}

export async function rotateCredentials({
  repository,
  keyring,
  dryRun,
  batchSize = 100,
}: MaintenanceOptions): Promise<RotationResult> {
  assertBatchSize(batchSize);
  const result: RotationResult = {
    scanned: 0,
    rotated: 0,
    wouldRotate: 0,
    conflicted: 0,
    failed: 0,
    failures: {},
  };
  let afterUserId: string | undefined;

  while (true) {
    const batch = await repository.listForRotation(keyring.activeKeyId, afterUserId, batchSize);
    if (batch.length === 0) break;

    for (const current of batch) {
      result.scanned += 1;
      afterUserId = current.userId;

      try {
        const plaintext = decryptCredential(current, current.userId, keyring);
        const replacement = encryptCredential(plaintext, current.userId, keyring);
        verifyMatches(replacement, current.userId, plaintext, keyring);

        if (dryRun) {
          result.wouldRotate += 1;
          continue;
        }

        if (await repository.storeRotated(current, replacement)) {
          result.rotated += 1;
        } else {
          result.conflicted += 1;
        }
      } catch (error) {
        result.failed += 1;
        recordFailure(result.failures, error);
      }
    }

    if (batch.length < batchSize) break;
  }

  return result;
}
