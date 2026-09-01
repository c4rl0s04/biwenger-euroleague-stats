import { describe, expect, it } from 'vitest';

import authConfig from '@/auth.config';
import {
  applyAccountStateToAuthToken,
  applyUserToAuthToken,
  createSafeBrowserSession,
  sanitizeAuthToken,
} from './session-safety';

const CANARY_TOKEN = 'biwenger-canary-token-never-expose';

function expectCanaryAbsent(value: unknown) {
  expect(JSON.stringify(value)).not.toContain(CANARY_TOKEN);
  expect(JSON.stringify(value)).not.toContain('biwengerToken');
}

describe('Auth.js Biwenger credential boundary', () => {
  it('removes a token already present in a legacy JWT', () => {
    const token = sanitizeAuthToken({ id: '42', biwengerToken: CANARY_TOKEN });

    expect(token).toEqual({ id: '42' });
    expectCanaryAbsent(token);
  });

  it('derives linked state without copying the credential into the JWT', () => {
    const token = applyUserToAuthToken(
      { sub: '42', biwengerToken: CANARY_TOKEN },
      { id: '42', email: 'safe@example.com', biwengerToken: CANARY_TOKEN }
    );
    const refreshed = applyAccountStateToAuthToken(token, {
      email: 'safe@example.com',
      biwengerLinked: true,
    });

    expect((refreshed as { biwengerLinked?: boolean }).biwengerLinked).toBe(true);
    expectCanaryAbsent(refreshed);
  });

  it('creates a browser session with safe linked state only', () => {
    const session = createSafeBrowserSession(
      { user: { name: 'Manager', biwengerToken: CANARY_TOKEN }, expires: '2099-01-01' },
      { id: '42', email: 'safe@example.com', biwengerLinked: true, biwengerToken: CANARY_TOKEN }
    );

    expect(session.user).toMatchObject({
      id: '42',
      email: 'safe@example.com',
      biwengerLinked: true,
    });
    expectCanaryAbsent(session);
  });

  it('keeps the proxy Auth.js callbacks free of legacy tokens', async () => {
    const jwt = await authConfig.callbacks.jwt({
      token: { id: '42', biwengerToken: CANARY_TOKEN },
      user: null,
    });
    const session = await authConfig.callbacks.session({
      session: { user: { biwengerToken: CANARY_TOKEN } },
      token: { ...jwt, biwengerToken: CANARY_TOKEN },
    });

    expectCanaryAbsent(jwt);
    expectCanaryAbsent(session);
  });
});
