export const BIWENGER_CREDENTIAL_ENVELOPE_VERSION = 1;
export const BIWENGER_CREDENTIAL_PURPOSE = 'biwenger-api-token';

export interface CredentialEnvelope {
  version: number;
  keyId: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface StoredCredential extends CredentialEnvelope {
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CredentialKeyring {
  activeKeyId: string;
  keys: ReadonlyMap<string, Uint8Array>;
}

export interface CredentialRecordRepository {
  hasEncrypted(userId: string): Promise<boolean>;
  findEncrypted(userId: string): Promise<StoredCredential | null>;
  findLegacyPlaintext(userId: string): Promise<string | null>;
  hasLegacyPlaintext(userId: string): Promise<boolean>;
  replaceCredential(userId: string, envelope: CredentialEnvelope, email?: string): Promise<void>;
  deleteCredential(userId: string): Promise<void>;
}

export interface CredentialLogger {
  warn(message: string, metadata: Readonly<Record<string, string>>): void;
}
