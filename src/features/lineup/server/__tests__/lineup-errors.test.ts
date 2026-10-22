import { expect, it } from 'vitest';
import {
  BiwengerAuthError,
  BiwengerMutationError,
  BiwengerNetworkError,
  BiwengerRateLimitError,
} from '@/features/provider/server';
import { CredentialError } from '@/lib/credentials/errors';
import { lineupErrorResponse, LineupOperationError } from '../errors';
it.each([
  [new BiwengerAuthError(401), 409, 'BIWENGER_RECONNECT_REQUIRED'],
  [new BiwengerAuthError(403), 403, 'BIWENGER_ACCESS_DENIED'],
  [new CredentialError('missing_credential'), 409, 'BIWENGER_RECONNECT_REQUIRED'],
  [new CredentialError('credential_integrity_failure'), 500, 'LINEUP_UNEXPECTED_ERROR'],
  [new BiwengerRateLimitError(), 429, 'BIWENGER_RATE_LIMITED'],
  [new BiwengerNetworkError('secret-canary'), 503, 'BIWENGER_UNAVAILABLE'],
  [new BiwengerMutationError('secret-canary', 400), 422, 'BIWENGER_REJECTED'],
  [new BiwengerMutationError('secret-canary', 500), 502, 'BIWENGER_REJECTED'],
  [new Error('secret-canary'), 500, 'LINEUP_UNEXPECTED_ERROR'],
  [
    new LineupOperationError('LINEUP_ROSTER_CHANGED', 'Revisa tu plantilla.', 409, {
      invalidPlayerIds: ['7'],
      affectedSlotIndexes: [2],
    }),
    409,
    'LINEUP_ROSTER_CHANGED',
  ],
])('maps errors safely to %s', async (error, status, code) => {
  const response = lineupErrorResponse(error);
  expect(response.status).toBe(status);
  const body = await response.json();
  expect(body).toMatchObject({ success: false, code });
  expect(typeof body.error).toBe('string');
  expect(JSON.stringify(body)).not.toContain('secret-canary');
  expect(response.headers.get('cache-control')).toContain('no-store');
});
