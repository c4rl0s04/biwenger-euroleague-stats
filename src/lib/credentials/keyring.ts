import 'server-only';

import { CredentialError } from './errors';
import type { CredentialKeyring } from './types';

const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const AES_256_KEY_BYTES = 32;

interface SerializedKey {
  id?: unknown;
  key?: unknown;
}

export interface CredentialKeyEnvironment {
  BIWENGER_CREDENTIAL_KEYS?: string;
  BIWENGER_CREDENTIAL_ACTIVE_KEY_ID?: string;
}

function decodeKey(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new CredentialError('invalid_key_configuration');
  }

  const decoded = Buffer.from(value, 'base64');
  if (decoded.length !== AES_256_KEY_BYTES || decoded.toString('base64') !== value) {
    throw new CredentialError('invalid_key_configuration');
  }

  return new Uint8Array(decoded);
}

export function parseCredentialKeyring(env: CredentialKeyEnvironment): CredentialKeyring {
  const serializedKeys = env.BIWENGER_CREDENTIAL_KEYS;
  const activeKeyId = env.BIWENGER_CREDENTIAL_ACTIVE_KEY_ID;

  if (!serializedKeys || !activeKeyId) {
    throw new CredentialError('missing_key_configuration');
  }

  if (!KEY_ID_PATTERN.test(activeKeyId)) {
    throw new CredentialError('invalid_key_configuration');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedKeys);
  } catch (error) {
    throw new CredentialError('invalid_key_configuration', { cause: error });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new CredentialError('invalid_key_configuration');
  }

  const keys = new Map<string, Uint8Array>();
  for (const entry of parsed as SerializedKey[]) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.id !== 'string' ||
      typeof entry.key !== 'string' ||
      !KEY_ID_PATTERN.test(entry.id)
    ) {
      throw new CredentialError('invalid_key_configuration');
    }

    if (keys.has(entry.id)) {
      throw new CredentialError('duplicate_key_identifier');
    }

    keys.set(entry.id, decodeKey(entry.key));
  }

  if (!keys.has(activeKeyId)) {
    throw new CredentialError('unknown_key_identifier');
  }

  return { activeKeyId, keys };
}

let cachedKeyring: CredentialKeyring | undefined;

export function getEnvironmentCredentialKeyring(): CredentialKeyring {
  cachedKeyring ??= parseCredentialKeyring({
    BIWENGER_CREDENTIAL_KEYS: process.env.BIWENGER_CREDENTIAL_KEYS,
    BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: process.env.BIWENGER_CREDENTIAL_ACTIVE_KEY_ID,
  });
  return cachedKeyring;
}

export function resetCredentialKeyringForTests(): void {
  cachedKeyring = undefined;
}
