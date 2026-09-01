import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createBiwengerCredentialService } from '../service';
import type {
  CredentialEnvelope,
  CredentialKeyring,
  CredentialLogger,
  CredentialRecordRepository,
  StoredCredential,
} from '../types';

class MemoryRepository implements CredentialRecordRepository {
  encrypted = new Map<string, StoredCredential>();
  legacy = new Map<string, string>();
  emails = new Map<string, string>();
  failNextReplace = false;

  async hasEncrypted(userId: string) {
    return this.encrypted.has(userId);
  }
  async findEncrypted(userId: string) {
    return this.encrypted.get(userId) ?? null;
  }
  async findLegacyPlaintext(userId: string) {
    return this.legacy.get(userId) ?? null;
  }
  async hasLegacyPlaintext(userId: string) {
    return this.legacy.has(userId);
  }
  async replaceCredential(userId: string, envelope: CredentialEnvelope, email?: string) {
    if (this.failNextReplace) {
      this.failNextReplace = false;
      throw new Error('synthetic storage failure');
    }
    this.encrypted.set(userId, { userId, ...envelope });
    this.legacy.delete(userId);
    if (email) this.emails.set(userId, email);
  }
  async deleteCredential(userId: string) {
    this.encrypted.delete(userId);
    this.legacy.delete(userId);
  }
}

const testKeyring: CredentialKeyring = {
  activeKeyId: 'test-key',
  keys: new Map([['test-key', new Uint8Array(Buffer.alloc(32, 5))]]),
};

describe('server-only Biwenger credential boundary', () => {
  let repository: MemoryRepository;

  beforeEach(() => {
    repository = new MemoryRepository();
  });

  function create(options: { fallback?: boolean; warn?: CredentialLogger['warn'] } = {}) {
    return createBiwengerCredentialService({
      repository,
      getKeyring: () => testKeyring,
      allowLegacyPlaintextFallback: options.fallback,
      logger: { warn: options.warn ?? vi.fn() },
    });
  }

  it('stores only an encrypted representation and exposes only status or callback-scoped plaintext', async () => {
    const service = create();
    const credential = 'synthetic-service-token';
    await service.storeCredential({ userId: 'actor', credential, email: 'actor@example.com' });

    const stored = repository.encrypted.get('actor');
    expect(stored).toBeDefined();
    expect(JSON.stringify(stored)).not.toContain(credential);
    expect(repository.legacy.has('actor')).toBe(false);
    expect(await service.hasCredential('actor')).toBe(true);
    expect(await service.withCredential('actor', 'test.use', async (value) => value)).toBe(
      credential
    );
  });

  it('relinks atomically and preserves the old credential after a failed replacement', async () => {
    const service = create();
    await service.storeCredential({ userId: 'actor', credential: 'old-synthetic-token' });
    repository.failNextReplace = true;

    await expect(
      service.storeCredential({ userId: 'actor', credential: 'failed-new-token' })
    ).rejects.toThrow('synthetic storage failure');
    expect(
      await service.withCredential('actor', 'test.after-failure', async (value) => value)
    ).toBe('old-synthetic-token');

    await service.storeCredential({ userId: 'actor', credential: 'new-synthetic-token' });
    expect(await service.withCredential('actor', 'test.after-relink', async (value) => value)).toBe(
      'new-synthetic-token'
    );
  });

  it('unlinks encrypted and legacy access', async () => {
    const service = create({ fallback: true });
    await service.storeCredential({ userId: 'actor', credential: 'synthetic-token' });
    repository.legacy.set('actor', 'legacy-synthetic-token');

    await service.deleteCredential('actor');
    expect(await service.hasCredential('actor')).toBe(false);
    await expect(
      service.withCredential('actor', 'test.unlinked', async (value) => value)
    ).rejects.toMatchObject({ code: 'missing_credential' });
  });

  it('uses explicit legacy fallback observably without logging credential material', async () => {
    const warn = vi.fn();
    const service = create({ fallback: true, warn });
    repository.legacy.set('actor', 'legacy-canary-token');

    expect(await service.withCredential('actor', 'test.fallback', async (value) => value)).toBe(
      'legacy-canary-token'
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('legacy-canary-token');
    expect(warn).toHaveBeenCalledWith(
      'Temporary plaintext credential fallback used',
      expect.objectContaining({
        category: 'legacy_credential_fallback',
        operation: 'test.fallback',
      })
    );
  });

  it('never allows one user to retrieve another user credential', async () => {
    const service = create();
    await service.storeCredential({ userId: 'owner', credential: 'owner-synthetic-token' });
    await expect(
      service.withCredential('viewer', 'test.ownership', async (value) => value)
    ).rejects.toMatchObject({ code: 'missing_credential' });
  });
});
