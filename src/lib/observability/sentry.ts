import * as Sentry from '@sentry/nextjs';

import { redactSensitiveData } from './sentry-redaction';

export { redactSensitiveData, sanitizeSentryEvent } from './sentry-redaction';

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
