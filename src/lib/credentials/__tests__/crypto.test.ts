import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { decryptCredential, encryptCredential } from '../crypto';
import { CredentialError } from '../errors';
import type { CredentialEnvelope, CredentialKeyring } from '../types';

function keyring(activeKeyId = 'key-a'): CredentialKeyring {
  return {
    activeKeyId,
    keys: new Map([
      ['key-a', new Uint8Array(Buffer.alloc(32, 1))],
      ['key-b', new Uint8Array(Buffer.alloc(32, 2))],
    ]),
  };
}

function expectCode(action: () => unknown, code: CredentialError['code']) {
  expect(action).toThrowError(expect.objectContaining({ code }));
}

function tamperEncodedBytes(value: string): string {
  const decoded = Buffer.from(value, 'base64url');
  decoded[0] ^= 1;
  return decoded.toString('base64url');
}

describe('Biwenger credential authenticated encryption', () => {
  const credential = 'synthetic-biwenger-token';

  it('round trips and uses a fresh IV for identical values', () => {
    const first = encryptCredential(credential, 'user-1', keyring());
    const second = encryptCredential(credential, 'user-1', keyring());

    expect(decryptCredential(first, 'user-1', keyring())).toBe(credential);
    expect(first).not.toEqual(second);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it.each(['ciphertext', 'iv', 'authTag'] as const)('fails safely when %s is modified', (field) => {
    const envelope = encryptCredential(credential, 'user-1', keyring());
    const modified: CredentialEnvelope = {
      ...envelope,
      [field]: tamperEncodedBytes(envelope[field]),
    };
    expectCode(
      () => decryptCredential(modified, 'user-1', keyring()),
      'credential_integrity_failure'
    );
  });

  it('fails with an incorrect key and an unknown key identifier', () => {
    const envelope = encryptCredential(credential, 'user-1', keyring());
    const wrongKeyring: CredentialKeyring = {
      activeKeyId: 'key-a',
      keys: new Map([['key-a', new Uint8Array(Buffer.alloc(32, 9))]]),
    };

    expectCode(
      () => decryptCredential(envelope, 'user-1', wrongKeyring),
      'credential_integrity_failure'
    );
    expectCode(
      () => decryptCredential({ ...envelope, keyId: 'missing' }, 'user-1', keyring()),
      'unknown_key_identifier'
    );
  });

  it('rejects unsupported versions and reassignment to another user', () => {
    const envelope = encryptCredential(credential, 'user-1', keyring());
    expectCode(
      () => decryptCredential({ ...envelope, version: 2 }, 'user-1', keyring()),
      'unsupported_envelope_version'
    );
    expectCode(
      () => decryptCredential(envelope, 'user-2', keyring()),
      'credential_integrity_failure'
    );
  });

  it('rejects malformed envelope data without returning partial plaintext', () => {
    const envelope = encryptCredential(credential, 'user-1', keyring());
    expectCode(
      () => decryptCredential({ ...envelope, iv: 'not valid!' }, 'user-1', keyring()),
      'malformed_envelope'
    );
  });
});
