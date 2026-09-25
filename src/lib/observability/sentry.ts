import * as Sentry from '@sentry/nextjs';

const SENSITIVE_KEY_PATTERN =
  /(?:token|auth|cookie|password|secret|api_?key|bearer|credential|private)/i;

/**
 * Recursively redacts sensitive keys matching credentials, tokens, or auth headers.
 */
export function redactSensitiveData<T>(input: T, depth = 0): T {
  if (depth > 5 || input === null || input === undefined) return input;

  if (typeof input === 'string') {
    // Check if the string looks like a JWT or Bearer token
    if (/bearer\s+[a-zA-Z0-9._-]+/i.test(input)) {
      return input.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]') as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return sanitized as unknown as T;
  }

  return input;
}

/**
 * Sentry beforeSend hook to scrub sensitive tokens and headers from all outgoing events.
 */
export function sanitizeSentryEvent(
  event: Sentry.ErrorEvent,
  _hint?: Sentry.EventHint
): Sentry.ErrorEvent | null {
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = redactSensitiveData(event.request.headers);
    }
    if (event.request.cookies) {
      if (typeof event.request.cookies === 'string') {
        (event.request as Record<string, unknown>).cookies = '[REDACTED]';
      } else if (typeof event.request.cookies === 'object') {
        const sanitizedCookies: Record<string, string> = {};
        for (const key of Object.keys(event.request.cookies)) {
          sanitizedCookies[key] = '[REDACTED]';
        }
        event.request.cookies = sanitizedCookies;
      }
    }
  }

  if (event.extra) {
    event.extra = redactSensitiveData(event.extra);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) {
        breadcrumb.data = redactSensitiveData(breadcrumb.data);
      }
      return breadcrumb;
    });
  }

  return event;
}

export interface SyncErrorContext {
  stepId?: string;
  stepTitle?: string;
  seasonId?: string;
  syncMode?: string;
  durationMs?: number;
  warningsCount?: number;
  counts?: Record<string, number>;
  extra?: Record<string, unknown>;
}

/**
 * Captures background sync and crawler errors with structured tags and execution metrics.
 */
export function captureSyncError(error: unknown, context: SyncErrorContext = {}): string | undefined {
  const err = error instanceof Error ? error : new Error(String(error || 'Unknown sync error'));

  // Never crash during error reporting
  try {
    return Sentry.captureException(err, {
      tags: {
        component: 'sync-manager',
        ...(context.stepId ? { syncStep: context.stepId } : {}),
        ...(context.seasonId ? { seasonId: context.seasonId } : {}),
        ...(context.syncMode ? { syncMode: context.syncMode } : {}),
      },
      extra: redactSensitiveData({
        stepTitle: context.stepTitle,
        durationMs: context.durationMs,
        warningsCount: context.warningsCount,
        counts: context.counts,
        ...context.extra,
      }),
    });
  } catch (sentryErr) {
    console.error('Failed to capture sync error in Sentry:', sentryErr);
    return undefined;
  }
}

/**
 * Captures general application exceptions with safe redaction.
 */
export function captureAppException(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): string | undefined {
  const err = error instanceof Error ? error : new Error(String(error || 'Unknown error'));

  try {
    return Sentry.captureException(err, {
      tags: context?.tags,
      extra: context?.extra ? redactSensitiveData(context.extra) : undefined,
    });
  } catch (sentryErr) {
    console.error('Failed to capture exception in Sentry:', sentryErr);
    return undefined;
  }
}
