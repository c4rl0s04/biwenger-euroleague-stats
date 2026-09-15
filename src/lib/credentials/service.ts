import 'server-only';

import { CredentialError } from './errors';
import { decryptCredential, encryptCredential } from './crypto';
import { getEnvironmentCredentialKeyring } from './keyring';
import { DrizzleCredentialRepository } from './repository';
import type { CredentialKeyring, CredentialLogger, CredentialRecordRepository } from './types';

export interface CredentialServiceOptions {
  repository: CredentialRecordRepository;
  getKeyring: () => CredentialKeyring;
  logger?: CredentialLogger;
}

export interface StoreCredentialInput {
  userId: string;
  credential: string;
  email?: string;
}

export function createBiwengerCredentialService(options: CredentialServiceOptions) {
  const { repository, getKeyring } = options;

  return {
    async hasCredential(userId: string): Promise<boolean> {
      return repository.hasEncrypted(userId);
    },

    async storeCredential({ userId, credential, email }: StoreCredentialInput): Promise<void> {
      const keyring = getKeyring();
      const envelope = encryptCredential(credential, userId, keyring);

      if (decryptCredential(envelope, userId, keyring) !== credential) {
        throw new CredentialError('credential_storage_failure');
      }

      await repository.replaceCredential(userId, envelope, email);
    },

    async withCredential<T>(
      userId: string,
      _operation: string,
      runWithCredential: (credential: string) => Promise<T>
    ): Promise<T> {
      const encrypted = await repository.findEncrypted(userId);
      if (encrypted) {
        const credential = decryptCredential(encrypted, userId, getKeyring());
        return runWithCredential(credential);
      }

      throw new CredentialError('missing_credential');
    },

    async deleteCredential(userId: string): Promise<void> {
      await repository.deleteCredential(userId);
    },
  };
}

export const biwengerCredentials = createBiwengerCredentialService({
  repository: new DrizzleCredentialRepository(),
  getKeyring: getEnvironmentCredentialKeyring,
});
