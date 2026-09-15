import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { decryptCredential, encryptCredential } from '../crypto';
import { rotateCredentials } from '../maintenance';
import type { CredentialMaintenanceRepository } from '../maintenance';
import type { CredentialEnvelope, CredentialKeyring, StoredCredential } from '../types';

class MemoryMaintenanceRepository implements CredentialMaintenanceRepository {
  encrypted = new Map<string, StoredCredential>();
  failStoreFor = new Set<string>();

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

describe('credential rotation', () => {
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
