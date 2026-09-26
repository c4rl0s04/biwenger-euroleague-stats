import { describe, expect, it, vi } from 'vitest';
import {
  captureAppException,
  captureSyncError,
  redactSensitiveData,
  sanitizeSentryEvent,
} from './sentry';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn((err: Error, options?: unknown) => 'mock-event-id'),
  init: vi.fn(),
}));

describe('Observability & Sentry Integration', () => {
  describe('redactSensitiveData', () => {
    it('redacts fields containing sensitive keywords regardless of case', () => {
      const data = {
        normalField: 'safeValue',
        BIWENGER_TOKEN: 'secret-token-12345',
        authorization: 'Basic dXNlcjpwYXNz',
        userPassword: 'my-password',
        sessionCookie: 'session=abc',
        nested: {
          apiKey: 'key-999',
          safeCount: 42,
        },
      };

      const result = redactSensitiveData(data);
      expect(result).toEqual({
        normalField: 'safeValue',
        BIWENGER_TOKEN: '[REDACTED]',
        authorization: '[REDACTED]',
        userPassword: '[REDACTED]',
        sessionCookie: '[REDACTED]',
        nested: {
          apiKey: '[REDACTED]',
          safeCount: 42,
        },
      });
    });

    it('redacts Bearer token strings inside arbitrary text', () => {
      const text = 'Failed with authorization Bearer eyJhbGciOiJIUzI1Ni...';
      const result = redactSensitiveData(text);
      expect(result).toBe('Failed with authorization Bearer [REDACTED]');
    });

    it('handles arrays and primitives safely', () => {
      expect(redactSensitiveData([1, 'string', null])).toEqual([1, 'string', null]);
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeSentryEvent', () => {
    it('strips cookies and sensitive headers from Sentry ErrorEvents', () => {
      const mockEvent: any = {
        request: {
          headers: {
            authorization: 'Bearer secret',
            'user-agent': 'Mozilla/5.0',
          },
          cookies: 'auth_token=abc123xyz',
        },
        extra: {
          biwengerUserId: '123',
          biwengerToken: 'super-secret',
        },
        breadcrumbs: [
          {
            message: 'Navigated',
            data: { token: 'my-token' },
          },
        ],
      };

      const sanitized = sanitizeSentryEvent(mockEvent);
      expect(sanitized?.request?.headers).toEqual({
        authorization: '[REDACTED]',
        'user-agent': 'Mozilla/5.0',
      });
      expect(sanitized?.request?.cookies).toBe('[REDACTED]');
      expect(sanitized?.extra).toEqual({
        biwengerUserId: '123',
        biwengerToken: '[REDACTED]',
      });
      expect(sanitized?.breadcrumbs?.[0]?.data).toEqual({
        token: '[REDACTED]',
      });

      // Test with cookies object as well
      const mockEventWithObjCookies: any = {
        request: {
          cookies: { session_token: 'secret', user_id: '456' },
        },
      };
      const sanitizedObj = sanitizeSentryEvent(mockEventWithObjCookies);
      expect(sanitizedObj?.request?.cookies).toEqual({
        session_token: '[REDACTED]',
        user_id: '[REDACTED]',
      });
    });
  });

  describe('captureSyncError', () => {
    it('formats sync tags and execution context cleanly', async () => {
      const { captureException } = await import('@sentry/nextjs');

      const errorId = captureSyncError(new Error('Euroleague rate limited'), {
        stepId: 'euroleague-games',
        stepTitle: 'Official Euroleague Games',
        seasonId: '2026-27',
        syncMode: 'routine',
        durationMs: 4500,
        warningsCount: 2,
        counts: { games: 18 },
      });

      expect(errorId).toBe('mock-event-id');
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            component: 'sync-manager',
            syncStep: 'euroleague-games',
            seasonId: '2026-27',
            syncMode: 'routine',
          },
          extra: expect.objectContaining({
            stepTitle: 'Official Euroleague Games',
            durationMs: 4500,
            warningsCount: 2,
            counts: { games: 18 },
          }),
        })
      );
    });

    it('handles non-Error objects gracefully', async () => {
      const { captureException } = await import('@sentry/nextjs');

      captureSyncError('String error message', { stepId: 'biwenger-catalog' });

      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'String error message' }),
        expect.any(Object)
      );
    });
  });

  describe('captureAppException', () => {
    it('captures generic application exceptions with tags', async () => {
      const { captureException } = await import('@sentry/nextjs');

      captureAppException(new Error('Database timeout'), {
        tags: { route: '/api/health' },
      });

      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { route: '/api/health' },
        })
      );
    });
  });
});
