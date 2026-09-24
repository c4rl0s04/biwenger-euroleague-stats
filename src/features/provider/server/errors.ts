/**
 * Provider error hierarchy with strict redaction guarantees.
 * Never leaks raw response bodies, bearer tokens, or decrypted credentials.
 */

const TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9_\-.~+/=]+/gi;

export function sanitizeErrorMessage(message: string): string {
  if (!message) return '';
  return message.replace(TOKEN_PATTERN, 'Bearer [REDACTED]');
}

export class BiwengerProviderError extends Error {
  readonly status?: number;
  readonly statusText?: string;
  readonly endpoint: string;

  constructor(message: string, status?: number, statusText?: string, endpoint: string = '') {
    super(sanitizeErrorMessage(message));
    this.name = 'BiwengerProviderError';
    this.status = status;
    this.statusText = statusText ? sanitizeErrorMessage(statusText) : undefined;
    this.endpoint = sanitizeErrorMessage(endpoint);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BiwengerRateLimitError extends BiwengerProviderError {
  readonly retryAfterMs?: number;

  constructor(endpoint: string = '', retryAfterMs?: number) {
    super(
      'Biwenger API Error: 429 Too Many Requests (Max retries exceeded or rate limit hit)',
      429,
      'Too Many Requests',
      endpoint
    );
    this.name = 'BiwengerRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class BiwengerAuthError extends BiwengerProviderError {
  constructor(status: 401 | 403, statusText: string = 'Unauthorized', endpoint: string = '') {
    super(`Biwenger API Error: ${status} ${statusText}`, status, statusText, endpoint);
    this.name = 'BiwengerAuthError';
  }
}

export class BiwengerNetworkError extends BiwengerProviderError {
  constructor(causeMessage: string, endpoint: string = '') {
    super(
      `Biwenger Network Error: ${sanitizeErrorMessage(causeMessage)}`,
      undefined,
      undefined,
      endpoint
    );
    this.name = 'BiwengerNetworkError';
  }
}

export class BiwengerMutationError extends BiwengerProviderError {
  constructor(
    message: string = 'Biwenger no pudo completar la operación solicitada.',
    status?: number,
    endpoint: string = ''
  ) {
    super(message, status, undefined, endpoint);
    this.name = 'BiwengerMutationError';
  }
}
