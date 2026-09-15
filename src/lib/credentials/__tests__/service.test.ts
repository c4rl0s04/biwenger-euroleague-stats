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
  emails = new Map<string, string>();
  failNextReplace = false;

  async hasEncrypted(userId: string) {
    return this.encrypted.has(userId);
  }
  async findEncrypted(userId: string) {
    return this.encrypted.get(userId) ?? null;
  }
  async replaceCredential(userId: string, envelope: CredentialEnvelope, email?: string) {
    if (this.failNextReplace) {
      this.failNextReplace = false;
      throw new Error('synthetic storage failure');
    }
    this.encrypted.set(userId, { userId, ...envelope });
    if (email) this.emails.set(userId, email);
  }
  async deleteCredential(userId: string) {
    this.encrypted.delete(userId);
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

  function create(options: { warn?: CredentialLogger['warn'] } = {}) {
    return createBiwengerCredentialService({
      repository,
      getKeyring: () => testKeyring,
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

  it('unlinks credential access', async () => {
    const service = create();
    await service.storeCredential({ userId: 'actor', credential: 'synthetic-token' });

    await service.deleteCredential('actor');
    expect(await service.hasCredential('actor')).toBe(false);
    await expect(
      service.withCredential('actor', 'test.unlinked', async (value) => value)
    ).rejects.toMatchObject({ code: 'missing_credential' });
  });

  it('throws missing_credential when credential does not exist', async () => {
    const service = create();
    expect(await service.hasCredential('missing-user')).toBe(false);
    await expect(
      service.withCredential('missing-user', 'test.missing', async (value) => value)
    ).rejects.toMatchObject({ code: 'missing_credential' });
  });

  it('never allows one user to retrieve another user credential', async () => {
    const service = create();
    await service.storeCredential({ userId: 'owner', credential: 'owner-synthetic-token' });
    await expect(
      service.withCredential('viewer', 'test.ownership', async (value) => value)
    ).rejects.toMatchObject({ code: 'missing_credential' });
  });
});
