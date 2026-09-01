import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { parseCredentialKeyring } from '../keyring';

const key = Buffer.alloc(32, 3).toString('base64');

function expectCode(environment: Parameters<typeof parseCredentialKeyring>[0], code: string) {
  expect(() => parseCredentialKeyring(environment)).toThrowError(expect.objectContaining({ code }));
}

describe('credential keyring configuration', () => {
  it('loads an active key while retaining previous keys for rotation', () => {
    const result = parseCredentialKeyring({
      BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: 'current',
      BIWENGER_CREDENTIAL_KEYS: JSON.stringify([
        { id: 'previous', key },
        { id: 'current', key: Buffer.alloc(32, 4).toString('base64') },
      ]),
    });

    expect(result.activeKeyId).toBe('current');
    expect(Array.from(result.keys.keys())).toEqual(['previous', 'current']);
  });

  it('fails closed for missing, malformed, duplicate, unsupported, or inactive key config', () => {
    expectCode({}, 'missing_key_configuration');
    expectCode(
      { BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: 'a', BIWENGER_CREDENTIAL_KEYS: 'not-json' },
      'invalid_key_configuration'
    );
    expectCode(
      {
        BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: 'a',
        BIWENGER_CREDENTIAL_KEYS: JSON.stringify([
          { id: 'a', key },
          { id: 'a', key },
        ]),
      },
      'duplicate_key_identifier'
    );
    expectCode(
      {
        BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: 'missing',
        BIWENGER_CREDENTIAL_KEYS: JSON.stringify([{ id: 'a', key }]),
      },
      'unknown_key_identifier'
    );
    expectCode(
      {
        BIWENGER_CREDENTIAL_ACTIVE_KEY_ID: 'a',
        BIWENGER_CREDENTIAL_KEYS: JSON.stringify([{ id: 'a', key: 'too-short' }]),
      },
      'invalid_key_configuration'
    );
  });
});
