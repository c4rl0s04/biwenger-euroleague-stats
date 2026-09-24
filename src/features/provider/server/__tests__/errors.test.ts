import { describe, expect, it } from 'vitest';
import {
  BiwengerAuthError,
  BiwengerMutationError,
  BiwengerNetworkError,
  BiwengerProviderError,
  BiwengerRateLimitError,
  sanitizeErrorMessage,
} from '../errors';

const CANARY_TOKEN = 'synthetic-secret-bearer-token-12345';

describe('Provider errors redaction and hierarchy', () => {
  it('sanitizeErrorMessage redacts bearer tokens', () => {
    const raw = `Failed request with Bearer ${CANARY_TOKEN} on header`;
    const sanitized = sanitizeErrorMessage(raw);

    expect(sanitized).not.toContain(CANARY_TOKEN);
    expect(sanitized).toBe('Failed request with Bearer [REDACTED] on header');
  });

  it('BiwengerProviderError redacts token in message and endpoint', () => {
    const error = new BiwengerProviderError(
      `Error with Bearer ${CANARY_TOKEN}`,
      500,
      'Internal Error',
      `/account?token=${CANARY_TOKEN}`
    );

    expect(error.message).not.toContain(CANARY_TOKEN);
    expect(error.status).toBe(500);
    expect(error.statusText).toBe('Internal Error');
    expect(error.name).toBe('BiwengerProviderError');
  });

  it('BiwengerRateLimitError has status 429 and correct name', () => {
    const error = new BiwengerRateLimitError('/market', 5000);

    expect(error.status).toBe(429);
    expect(error.name).toBe('BiwengerRateLimitError');
    expect(error.retryAfterMs).toBe(5000);
    expect(error.message).toContain('429 Too Many Requests');
  });

  it('BiwengerAuthError handles 401 and 403', () => {
    const err401 = new BiwengerAuthError(401, 'Unauthorized', '/user');
    expect(err401.status).toBe(401);
    expect(err401.name).toBe('BiwengerAuthError');

    const err403 = new BiwengerAuthError(403, 'Forbidden', '/user');
    expect(err403.status).toBe(403);
    expect(err403.name).toBe('BiwengerAuthError');
  });

  it('BiwengerNetworkError formats and redacts network cause', () => {
    const netErr = new BiwengerNetworkError(`fetch failed for Bearer ${CANARY_TOKEN}`, '/user');

    expect(netErr.message).not.toContain(CANARY_TOKEN);
    expect(netErr.name).toBe('BiwengerNetworkError');
  });

  it('BiwengerMutationError defaults to safe fixed message', () => {
    const mutErr = new BiwengerMutationError();

    expect(mutErr.message).toBe('Biwenger no pudo completar la operación solicitada.');
    expect(mutErr.name).toBe('BiwengerMutationError');
  });
});
