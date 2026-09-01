export type CredentialErrorCode =
  | 'missing_credential'
  | 'missing_key_configuration'
  | 'invalid_key_configuration'
  | 'duplicate_key_identifier'
  | 'unknown_key_identifier'
  | 'unsupported_envelope_version'
  | 'malformed_envelope'
  | 'credential_integrity_failure'
  | 'invalid_credential_input'
  | 'credential_storage_failure';

const SAFE_MESSAGES: Record<CredentialErrorCode, string> = {
  missing_credential: 'No linked Biwenger credential is available.',
  missing_key_configuration: 'Credential encryption is not configured.',
  invalid_key_configuration: 'Credential encryption configuration is invalid.',
  duplicate_key_identifier: 'Credential encryption configuration contains a duplicate key.',
  unknown_key_identifier: 'The credential requires an unavailable encryption key.',
  unsupported_envelope_version: 'The stored credential version is not supported.',
  malformed_envelope: 'The stored credential is malformed.',
  credential_integrity_failure: 'The stored credential failed integrity verification.',
  invalid_credential_input: 'The supplied credential is invalid.',
  credential_storage_failure: 'The credential could not be stored safely.',
};

export class CredentialError extends Error {
  readonly code: CredentialErrorCode;

  constructor(code: CredentialErrorCode, options?: ErrorOptions) {
    super(SAFE_MESSAGES[code], options);
    this.name = 'CredentialError';
    this.code = code;
  }
}

export function credentialErrorCode(error: unknown): CredentialErrorCode | 'unexpected_error' {
  return error instanceof CredentialError ? error.code : 'unexpected_error';
}
