import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { CredentialError } from './errors';
import {
  BIWENGER_CREDENTIAL_ENVELOPE_VERSION,
  BIWENGER_CREDENTIAL_PURPOSE,
  type CredentialEnvelope,
  type CredentialKeyring,
} from './types';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MAX_CREDENTIAL_BYTES = 16_384;
const MAX_ENCODED_FIELD_LENGTH = 65_536;

function encodeAad(userId: string, keyId: string, version: number): Buffer {
  const encode = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
  return Buffer.from(
    `purpose=${encode(BIWENGER_CREDENTIAL_PURPOSE)}&user=${encode(userId)}&version=${version}&key=${encode(keyId)}`,
    'utf8'
  );
}

function requireKey(keyring: CredentialKeyring, keyId: string): Buffer {
  const key = keyring.keys.get(keyId);
  if (!key) throw new CredentialError('unknown_key_identifier');
  if (key.byteLength !== 32) throw new CredentialError('invalid_key_configuration');
  return Buffer.from(key);
}

function decodeEnvelopeField(value: string, expectedBytes?: number): Buffer {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_ENCODED_FIELD_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new CredentialError('malformed_envelope');
  }

  const decoded = Buffer.from(value, 'base64url');
  if (
    decoded.toString('base64url') !== value ||
    (expectedBytes && decoded.length !== expectedBytes)
  ) {
    throw new CredentialError('malformed_envelope');
  }
  return decoded;
}

export function encryptCredential(
  plaintext: string,
  userId: string,
  keyring: CredentialKeyring
): CredentialEnvelope {
  if (
    typeof plaintext !== 'string' ||
    plaintext.length === 0 ||
    Buffer.byteLength(plaintext, 'utf8') > MAX_CREDENTIAL_BYTES ||
    typeof userId !== 'string' ||
    userId.length === 0
  ) {
    throw new CredentialError('invalid_credential_input');
  }

  const version = BIWENGER_CREDENTIAL_ENVELOPE_VERSION;
  const keyId = keyring.activeKeyId;
  const key = requireKey(keyring, keyId);
  const iv = randomBytes(IV_BYTES);

  try {
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    cipher.setAAD(encodeAad(userId, keyId, version));
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      version,
      keyId,
      ciphertext: ciphertext.toString('base64url'),
      iv: iv.toString('base64url'),
      authTag: authTag.toString('base64url'),
    };
  } finally {
    key.fill(0);
  }
}

export function decryptCredential(
  envelope: CredentialEnvelope,
  userId: string,
  keyring: CredentialKeyring
): string {
  if (envelope.version !== BIWENGER_CREDENTIAL_ENVELOPE_VERSION) {
    throw new CredentialError('unsupported_envelope_version');
  }
  if (typeof userId !== 'string' || userId.length === 0 || typeof envelope.keyId !== 'string') {
    throw new CredentialError('malformed_envelope');
  }

  const key = requireKey(keyring, envelope.keyId);
  try {
    const ciphertext = decodeEnvelopeField(envelope.ciphertext);
    const iv = decodeEnvelopeField(envelope.iv, IV_BYTES);
    const authTag = decodeEnvelopeField(envelope.authTag, AUTH_TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAAD(encodeAad(userId, envelope.keyId, envelope.version));
    decipher.setAuthTag(authTag);

    try {
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch (error) {
      throw new CredentialError('credential_integrity_failure', { cause: error });
    }
  } finally {
    key.fill(0);
  }
}
