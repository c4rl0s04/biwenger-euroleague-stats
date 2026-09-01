import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { decryptCredential, encryptCredential } from '../crypto';
import { migrateLegacyCredentials, rotateCredentials } from '../maintenance';
import type { CredentialMaintenanceRepository, LegacyCredentialCandidate } from '../maintenance';
import type { CredentialEnvelope, CredentialKeyring, StoredCredential } from '../types';

class MemoryMaintenanceRepository implements CredentialMaintenanceRepository {
  legacy: LegacyCredentialCandidate[] = [];
  encrypted = new Map<string, StoredCredential>();
  failStoreFor = new Set<string>();

  async listLegacy(afterUserId: string | undefined, limit: number) {
    return this.legacy.filter((row) => !afterUserId || row.userId > afterUserId).slice(0, limit);
  }
  async findEncrypted(userId: string) {
    return this.encrypted.get(userId) ?? null;
  }
  async storeMigrated(userId: string, envelope: CredentialEnvelope) {
    if (this.failStoreFor.has(userId)) throw new Error('synthetic per-record failure');
    if (this.encrypted.has(userId)) return 'already_exists' as const;
    this.encrypted.set(userId, { userId, ...envelope });
    return 'created' as const;
  }
  async listForRotation(activeKeyId: string, afterUserId: string | undefined, limit: number) {
    return Array.from(this.encrypted.values())
      .filter((row) => row.keyId !== activeKeyId && (!afterUserId || row.userId > afterUserId))
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .slice(0, limit);
  }
  async storeRotated(current: StoredCredential, replacement: CredentialEnvelope) {
    if (this.failStoreFor.has(current.userId)) throw new Error('synthetic per-record failure');
    const latest = this.encrypted.get(current.userId);
    if (!latest || latest.ciphertext !== current.ciphertext) return false;
    this.encrypted.set(current.userId, { userId: current.userId, ...replacement });
    return true;
  }
}

const oldAndNewKeyring: CredentialKeyring = {
  activeKeyId: 'new',
  keys: new Map([
    ['old', new Uint8Array(Buffer.alloc(32, 6))],
    ['new', new Uint8Array(Buffer.alloc(32, 7))],
  ]),
};

describe('credential migration and rotation', () => {
  it('dry-runs without writes, then migrates and safely verifies repeated runs', async () => {
    const repository = new MemoryMaintenanceRepository();
    repository.legacy = [
      { userId: 'a', plaintext: 'synthetic-a' },
      { userId: 'b', plaintext: 'synthetic-b' },
    ];

    const dryRun = await migrateLegacyCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: true,
      batchSize: 1,
    });
    expect(dryRun).toMatchObject({ scanned: 2, wouldMigrate: 2, migrated: 0, failed: 0 });
    expect(repository.encrypted.size).toBe(0);

    const applied = await migrateLegacyCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
      batchSize: 1,
    });
    expect(applied).toMatchObject({ scanned: 2, migrated: 2, failed: 0 });
    expect(repository.legacy).toHaveLength(2);
    expect(JSON.stringify(Array.from(repository.encrypted.values()))).not.toContain('synthetic-a');

    const repeated = await migrateLegacyCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
    });
    expect(repeated).toMatchObject({ migrated: 0, alreadyVerified: 2, failed: 0 });
  });

  it('continues after an individual migration failure and is resumable', async () => {
    const repository = new MemoryMaintenanceRepository();
    repository.legacy = [
      { userId: 'a', plaintext: 'synthetic-a' },
      { userId: 'b', plaintext: 'synthetic-b' },
    ];
    repository.failStoreFor.add('a');

    const first = await migrateLegacyCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
    });
    expect(first).toMatchObject({ scanned: 2, migrated: 1, failed: 1 });

    repository.failStoreFor.clear();
    const resumed = await migrateLegacyCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
    });
    expect(resumed).toMatchObject({ migrated: 1, alreadyVerified: 1, failed: 0 });
  });

  it('rotates old records, preserves access, and safely resumes after interruption', async () => {
    const repository = new MemoryMaintenanceRepository();
    const oldKeyring: CredentialKeyring = {
      activeKeyId: 'old',
      keys: oldAndNewKeyring.keys,
    };
    for (const userId of ['a', 'b']) {
      repository.encrypted.set(userId, {
        userId,
        ...encryptCredential(`synthetic-${userId}`, userId, oldKeyring),
      });
    }

    const preview = await rotateCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: true,
    });
    expect(preview).toMatchObject({ wouldRotate: 2, rotated: 0 });
    expect(Array.from(repository.encrypted.values()).every((row) => row.keyId === 'old')).toBe(
      true
    );

    repository.failStoreFor.add('a');
    const partial = await rotateCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
      batchSize: 1,
    });
    expect(partial).toMatchObject({ scanned: 2, rotated: 1, failed: 1 });

    repository.failStoreFor.clear();
    const resumed = await rotateCredentials({
      repository,
      keyring: oldAndNewKeyring,
      dryRun: false,
    });
    expect(resumed).toMatchObject({ scanned: 1, rotated: 1, failed: 0 });
    expect(decryptCredential(repository.encrypted.get('a')!, 'a', oldAndNewKeyring)).toBe(
      'synthetic-a'
    );
    expect(decryptCredential(repository.encrypted.get('b')!, 'b', oldAndNewKeyring)).toBe(
      'synthetic-b'
    );
  });
});
